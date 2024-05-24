import sgMail from '@sendgrid/mail';

import config from '~/config';

import { env } from './nunjucks';

sgMail.setApiKey(config.sendGrid.apiKey);

export const notify = async <T extends object>(
  email: string | string[],
  subject: string,
  view: string,
  data: T,
) => {
  const html = env.render(view, data);

  return sgMail.send({
    from: config.sendGrid.from,
    to: email,
    subject,
    html,
  });
};
