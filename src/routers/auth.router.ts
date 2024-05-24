import { VerifyCodeType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { signSession } from '~/helpers/jwt.helpers';
import Logger from '~/helpers/logger.helpers';
import {
  checkCode,
  compareHashedValue,
  getHashedValue,
  getPublic,
  resendVerificationCode,
} from '~/helpers/user.helpers';
import { notify } from '~/lib/mailer';
import { prismaClient } from '~/lib/prisma';
import { router } from '~/lib/trpc';
import { publicProcedure, withRecaptcha } from '~/middlewares/access.middlewares';

const logger = Logger('auth');

const logout = publicProcedure.mutation(async ({ ctx }) => {
  if (!ctx.session) return false;

  await prismaClient.session.delete({
    where: {
      id: ctx.session.id,
    },
  });

  logger.info('Signed out', ctx);

  return true;
});

const login = publicProcedure
  .input(
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .strict(),
  )
  .mutation(async ({ input, ctx }) => {
    const { email, password } = input;
    const user = await prismaClient.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logger.info('Signin attempt. User not found', ctx, 0, {
        email,
      });

      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    if (!user.active) {
      logger.info('Signin attempt. User not active', ctx, 0, {
        email,
      });

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Please verify your email',
      });
    }

    const isMatch = await compareHashedValue(password, user.password);

    if (!isMatch) {
      logger.info('Signin attempt. Wrong password', ctx, 0, {
        email,
      });

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Email/Password does not match',
      });
    }

    const token = await signSession(user.id, ctx);

    const account = getPublic({
      type: 'user',
      data: user,
    });

    return {
      ...account,
      token,
    };
  });

const register = publicProcedure
  .input(
    z
      .object({
        email: z.string().email(),
        subscribe: z.boolean().optional().default(false),
        password: z.string().min(6),
        firstname: z.string().regex(/^[\w\d\s-]+$/, 'Firstname is invalid'),
        lastname: z.string().regex(/^[\w\d\s-]+$/, 'Lastname is invalid'),
      })
      .strict(),
  )
  .mutation(async ({ input, ctx }) => {
    const { email, password, firstname, lastname } = input;
    const user = await prismaClient.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      if (!user.active) {
        await resendVerificationCode(user);
        return true;
      }

      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User already exists',
      });
    }

    const created = await prismaClient.user.create({
      data: {
        email: email.toLowerCase(),
        firstname,
        lastname,
        password: await getHashedValue(password),
        active: false,
        newsletter: input.subscribe,
      },
    });

    await resendVerificationCode(created);

    logger.info('User created', ctx, 0, {
      email,
      firstname,
      lastname,
    });

    return true;
  });

const verifyCode = publicProcedure
  .input(
    z
      .object({
        email: z.string().email(),
        code: z.string(),
      })
      .strict(),
  )
  .mutation(async ({ input, ctx }) => {
    const { email, code } = input;
    const message = 'Invalid code or email address';

    const user = await prismaClient.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.active) {
      logger.info('trying to validate invalid user account', ctx, 0, {
        email,
      });
      throw new TRPCError({
        code: 'NOT_FOUND',
        message,
      });
    }

    await checkCode({
      type: VerifyCodeType.VALIDATE_EMAIL,
      code,
      user,
      ctx,
    });

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        active: true,
      },
    });

    logger.info('User activated', ctx);

    await notify({
      to: user.email,
      subject: 'Your account has been activated',
      view: 'verify-email-success.view.njk',
      data: {},
    });

    return true;
  });

const resendCode = withRecaptcha
  .input(
    z
      .object({
        email: z.string().email(),
        type: z.enum(['forgot-password', 'validate-email']),
      })
      .strict(),
  )
  .mutation(async ({ input: { email, type }, ctx }) => {
    const user = await prismaClient.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logger.info('user was not found', ctx, 0, {
        action: 'auth:resendCode',
        email,
        type,
      });
      return true;
    }

    await resendVerificationCode(
      user,
      type === 'forgot-password' ? VerifyCodeType.FORGOT_PASSWORD : VerifyCodeType.VALIDATE_EMAIL,
    );

    return true;
  });

const changePassword = withRecaptcha
  .input(
    z
      .object({
        email: z.string().email(),
        code: z.string().min(6),
        password: z.string().min(6),
      })
      .strict(),
  )
  .mutation(async ({ input: { email, code, password }, ctx }) => {
    const user = await prismaClient.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await checkCode({
      type: VerifyCodeType.FORGOT_PASSWORD,
      code,
      user,
      ctx,
    });

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await getHashedValue(password),
      },
    });

    await notify({
      to: user.email,
      subject: 'Password Changed Successfully',
      view: 'reset-password-success.view.njk',
      data: {},
    });

    return true;
  });

export const eosLogin = publicProcedure;

export default router({
  login,
  logout,
  register,
  verifyCode,
  resendCode,
  changePassword,
});
