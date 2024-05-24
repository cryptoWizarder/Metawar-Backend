type LockConfig = Partial<{
  timeout: number;
}>;

const values: Map<
  string,
  LockConfig & {
    lock$: Promise<boolean>;
  }
> = new Map();

export function timeout$(nb = 1000, cb?: () => void) {
  return new Promise<boolean>((resolve) =>
    setTimeout(() => {
      resolve(true);
      cb?.();
    }, nb),
  );
}

export async function lock(key: string, config?: LockConfig) {
  if (values.has(key)) {
    throw new Error('Already locked');
  }

  const lock$ = timeout$(config?.timeout || 1000, () => {
    values.delete(key);
  });

  values.set(key, {
    ...config,
    lock$,
  });

  return await lock$;
}

export async function unlock(key: string) {
  values.delete(key);
}

export async function tryLock(key: string, config?: LockConfig) {
  if (!values.has(key)) {
    return lock(key, config);
  }

  return await values.get(key)?.lock$;
}
