import https from 'node:https';
import http from 'node:http';

export const fetch = async <T>(
  url: string,
  opts: https.RequestOptions & Partial<{ body: string }> = {},
) => {
  return new Promise<{
    status?: number;
    statusMessage?: string;
    headers: http.IncomingHttpHeaders;
    data: T;
  }>((resolve, reject) => {
    const res = https.request(url, opts, (res) => {
      let result = '';

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        result += chunk;
      });

      res.on('end', () => {
        let data: T = null as T;

        try {
          data = JSON.parse(result);
        } catch (e) {
          return reject(e);
        }

        resolve({
          data: data,
          headers: res.headers,
          status: res.statusCode,
          statusMessage: res.statusMessage,
        });
      });

      res.on('error', (err) => {
        reject(err);
      });
    });

    if (opts.body) {
      res.write(opts.body);
    }

    res.end();
  });
};
