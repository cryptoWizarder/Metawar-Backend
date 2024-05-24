import { EmailData } from '@sendgrid/helpers/classes/email-address';
import sgMail from '@sendgrid/mail';

import config from '~/config';

import { fetch } from './fetch';
import { env } from './nunjucks';

sgMail.setApiKey(config.mailer.sendgrid.apiKey);

type TNotifyOptions<T extends object = object> = {
  to: EmailData | EmailData[];
  replyTo?: EmailData;
  bcc?: EmailData | EmailData[];
  cc?: EmailData | EmailData[];
  subject: string;
  view: string;
  data: T;
};

type TNameEmail = {
  name?: string;
  email: string;
};

function sgSend(opts: sgMail.MailDataRequired) {
  return sgMail.send(opts);
}

function getEmailData(
  email: EmailData | EmailData[] | undefined,
  isArray = false,
): TNameEmail | TNameEmail[] | undefined {
  if (!email) return;

  if (Array.isArray(email)) {
    return email.map<TNameEmail>((v) => getEmailData(v) as TNameEmail);
  }

  const result = typeof email === 'string' ? { email } : email;
  return isArray ? [result] : result;
}

function brevoSend(opts: sgMail.MailDataRequired) {
  return fetch<boolean>('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.mailer.brevo.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: getEmailData(opts.from),
      to: getEmailData(opts.to, true),
      subject: opts.subject,
      htmlContent: opts.html,
      cc: getEmailData(opts.cc, true),
      bcc: getEmailData(opts.bcc, true),
      replyTo: getEmailData(opts.replyTo),
    }),
  }).then(({ status, statusMessage }) => {
    if (!status?.toString(10).startsWith('2')) return Promise.reject(new Error(statusMessage));
  });
}

function pmSend(opts: sgMail.MailDataRequired) {
  return fetch<{ Message: string }>('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': config.mailer.postmark.apiKey,
      'content-type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      From: (getEmailData(opts.from) as TNameEmail)?.email,
      To: (getEmailData(opts.to, true) as TNameEmail[])?.map((v) => v.email).join(','),
      Subject: opts.subject,
      HtmlBody: opts.html,
      MessageStream: 'outbound',
      Cc: (getEmailData(opts.cc, true) as TNameEmail[])?.map((v) => v.email).join(','),
      Bcc: (getEmailData(opts.bcc, true) as TNameEmail[])?.map((v) => v.email).join(','),
      ReplyTo: (getEmailData(opts.replyTo) as TNameEmail)?.email,
    }),
  }).then(({ status, data }) => {
    if (!status?.toString(10).startsWith('2')) return true;
    return Promise.reject(new Error(data.Message));
  });
}

export const notify = async <T extends object>({ view, data, ...rest }: TNotifyOptions<T>) => {
  const html = env.render(view, data);
  const opts: sgMail.MailDataRequired = {
    from: config.mailer.from,
    ...rest,
    html,
  };

  switch (config.mailer.type) {
    case 'brevo':
      return brevoSend(opts);
    case 'sendgrid':
      return sgSend(opts);
    case 'postmark':
      return pmSend(opts);
  }
};
