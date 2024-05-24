import { Session, User, Code } from '@prisma/client';
import { Request, Response } from 'express';

export {};

declare global {
  type TContext = Partial<{
    session: Session;
    user: User;
    token: string;
    code: Code;
  }> & {
    req: Request;
    res?: Response;
  };

  namespace Express {
    export interface Request {
      ctx?: TContext;
    }
  }
}
