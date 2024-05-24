import { User, VerifyCodeType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';

import config from '~/config';
import { notify } from '~/lib/mailer';
import { prismaClient } from '~/lib/prisma';
import { getPublicSession } from '~/lib/session';
import Logger from './logger.helpers';

const { security, publicUrl, prefix } = config;

type UserType = {
  type: 'user';
  data: User | null;
};

const logger = Logger('auth');

export async function getHashedValue(value: string) {
  return await bcrypt.hash(value, 10);
}

export async function compareHashedValue(value: string, hashedValue: string) {
  return await bcrypt.compare(value, hashedValue);
}

export async function checkCode({
  user,
  code,
  type = VerifyCodeType.VALIDATE_EMAIL,
  ctx,
}: {
  user: User;
  code: string;
  type?: VerifyCodeType;
  ctx: TContext;
}) {
  const message = 'Invalid code or email address';
  const verifyCode = await prismaClient.code.findFirst({
    where: {
      email: user.email,
      code,
      type,
    },
  });

  if (!verifyCode) {
    logger.info('trying to validate a user account with invalid code', ctx, 0, {
      email: user.email,
      code,
    });
    throw new TRPCError({
      code: 'NOT_FOUND',
      message,
    });
  }

  if (verifyCode.nb_tries >= security.code.maxTries) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Code has been used too many times',
    });
  }

  if (
    verifyCode.last_try_at &&
    Date.now() - verifyCode.last_try_at.getTime() < security.code.tryDelay
  ) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Too quick, please wait and try again',
    });
  }

  if (verifyCode.code !== code) {
    await prismaClient.code.update({
      where: {
        id: verifyCode.id,
      },
      data: {
        last_try_at: new Date(),
        nb_tries: verifyCode.nb_tries + 1,
      },
    });

    throw new TRPCError({
      code: 'NOT_FOUND',
      message,
    });
  }

  await prismaClient.code.delete({
    where: {
      id: verifyCode.id,
    },
  });

  return true;
}

export async function resendVerificationCode(
  user: User,
  type: VerifyCodeType = VerifyCodeType.VALIDATE_EMAIL,
) {
  if (type === VerifyCodeType.VALIDATE_EMAIL && user.active) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User already active',
    });
  }

  const { email, firstname, lastname } = user;

  let c = await prismaClient.code.findFirst({
    where: {
      email: email.toLowerCase(),
      type,
    },
  });

  const options = (() => {
    switch (type) {
      case 'FORGOT_PASSWORD':
        return {
          template: 'reset-password.view.njk',
          title: 'Reset Password Code',
          type,
        };
      default:
        return {
          template: 'verify-email.view.njk',
          title: 'Activate your account',
          type,
        };
    }
  })();

  if (!c) {
    const code = randomInt(security.code.min, security.code.max).toString();
    c = await prismaClient.code.create({
      data: {
        email: email.toLowerCase(),
        code,
        type,
        last_resend_at: new Date(),
        nb_resends: 0,
      },
    });
  } else {
    if (c.nb_resends >= security.code.maxSends) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Too many resends. Try again later',
      });
    }

    if (c.last_resend_at && Date.now() - c.last_resend_at.getTime() < security.code.tryDelay) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Too quick, please wait and try again',
      });
    }

    c.nb_resends++;
    c.last_resend_at = new Date();

    c = await prismaClient.code.update({
      where: {
        id: c.id,
      },
      data: {
        nb_resends: c.nb_resends,
        last_resend_at: c.last_resend_at,
      },
    });
  }

  await notify({
    to: email,
    subject: options.title,
    view: options.template,
    data: {
      title: options.title,
      fullname: `${firstname} ${lastname}`,
      code: c.code,
      link: `${publicUrl}${prefix}/auth/verifyCode?email=${encodeURIComponent(
        email.toLowerCase(),
      )}&code=${c.code}`,
    },
  });

  return c;
}

export function getPublic(payload: UserType) {
  if (!payload.data) return payload.data;
  switch (payload.type) {
    case 'user':
      return getPublicSession(payload.data);
    default:
      return payload.data;
  }
}
