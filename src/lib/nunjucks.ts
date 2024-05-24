import { Environment, FileSystemLoader } from 'nunjucks';
import { resolve } from 'node:path';

export const rootViews = resolve(__dirname, '..', 'views');
export const env = new Environment(new FileSystemLoader(rootViews));
