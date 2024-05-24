import { router } from '~/lib/trpc';

import agenda from './agenda.router';
import auth from './auth.router';
import eos from './eos.router';
import me from './me.router';
import asset from './asset.router';
import nonce from './nonce.router';

export const appRouter = router({
  me,
  eos,
  auth,
  nonce,
  asset,
  agenda,
});

export type AppRouter = typeof appRouter;
