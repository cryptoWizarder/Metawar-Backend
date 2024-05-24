import { NextFunction, Request, Response } from 'express';
import Logger from '~/helpers/logger.helpers';

import { createContext } from '~/lib/trpc/context';
import { appRouter } from '~/routers/index';

const logger = Logger('handlers:main');

/**
 * Healthcheck endpoint
 * @param req The request object
 * @param res The response Object
 * @returns void
 */
export const healthcheck = async (req: Request, res: Response) => {
  return res.json(true);
};

/**
 * Load the context
 * @param req The request object
 * @param res The response Object
 * @returns void
 */
export const loadContext = async (req: Request, res: Response, next: NextFunction) => {
  const ctx = await createContext({
    req,
    res,
  });

  req.ctx = ctx;
  return next();
};

/**
 * Verify code
 * @param req The request object
 * @param res The response Object
 * @returns void
 */
export const verifyCode = async (req: Request, res: Response) => {
  const { email, code } = req.query as {
    email: string;
    code: string;
  };

  const router = appRouter.createCaller({ req, res });

  try {
    await router.auth.verifyCode({
      code,
      email,
    });
    return res.redirect('/verify-success');
  } catch (e) {
    logger.error('Trying to verify an invalid email/code', req.ctx, 0, {
      email,
      code,
    });
    return res.status(404).render('error.view.html', {
      title: 'Error',
      subtitle: 'Code not found',
      description: 'The code or email you entered is invalid.',
    });
  }
};
