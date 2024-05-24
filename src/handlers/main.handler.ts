import { Router } from 'express';

import { healthcheck, loadContext, verifyCode } from './main.controller';

const router = Router();

router.use(loadContext);

router.route('/healthcheck').get(healthcheck);
router.route('/auth/verifyCode').get(verifyCode);

export default router;
