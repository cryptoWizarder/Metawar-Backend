type KeyName = {
  name: string;
  key?: string;
};

type TupleMap<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { key: string }
    ? T[K]['key']
    : T[K] extends { name: string }
      ? T[K]['name']
      : never;
};

export type NewItem<T> = Omit<T, 'id'>;

export function mapNamedArrayToTuple<T extends readonly KeyName[]>(input: T) {
  return input.map(({ key, name }) => key || name) as TupleMap<T>;
}
