import { TRPCError } from '@trpc/server';
import config from '~/config';
import { fetch } from '~/lib/fetch';
import { middleware, procedure } from '~/lib/trpc';

const { recaptcha } = config;

export async function verifyRecaptchaToken(ctx: TContext): Promise<boolean> {
  const { secretKey, minScore, enabled } = recaptcha;

  if (!enabled) return true;

  const token = ctx.req.get('x-recaptcha');

  if (!token) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Missing ReCaptcha token' });
  }

  let status: number | undefined;
  let data: {
    success: boolean;
    score: number;
  };

  try {
    ({ status, data } = await fetch<typeof data>(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
    ));
  } catch (e) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Error while verifying ReCaptcha token' });
  }

  if (status !== 200 || data.score < minScore) {
    console.error(status, data);
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid ReCaptcha token' });
  }

  return true;
}

export const isAuthenticated = middleware(({ ctx, next }) => {
  const { user } = ctx;
  if (!user || !user?.active) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx: { ...ctx, user } });
});

export const checkRoles = middleware(({ ctx, next, meta }) => {
  const { user } = ctx;
  const allowed = meta?.allowed;

  if (allowed && !user?.roles?.find((role) => allowed.includes(role)))
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: "You don't have the right access to perform this action",
    });

  return next({ ctx });
});

export const isGoogleRecaptchaIsValid = middleware(async ({ ctx, next }) => {
  await verifyRecaptchaToken(ctx);

  return next({ ctx });
});

export const withRecaptcha = procedure.use(isGoogleRecaptchaIsValid);
export const publicProcedure = procedure.use(checkRoles);
export const protectedProcedure = publicProcedure.use(isAuthenticated);
