import debug from 'debug';

import config from './config/index';
import { get } from './config/tools';
import { start } from './lib/express';
import { start as startAgenda } from './lib/agenda';

const log = debug('app:main');

(async () => {
  const app = await start();

  app.listen(config.port, config.host, () => {
    startAgenda();
    log('Env               : %s', config.env);
    log('MONGODB           : %s', get('DATABASE_URL'));
    log('Server started at : %s', config.publicUrl);
  });
})();
