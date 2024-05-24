import { PaginationQuery } from '~/interfaces/main';
import { middleware } from '~/lib/trpc';

export const parsePaginable = (selects: string[]) =>
  middleware(({ ctx, next, input }) => {
    let { $skip = 0, $top = 100, $select = '' } = (input as PaginationQuery) || {};

    $skip = +$skip;
    $top = +$top;

    $skip = isNaN($skip) || $skip < 0 ? 0 : Math.floor($skip);
    $top = isNaN($top) || $top > 100 || $top < 0 ? 100 : Math.floor($top);
    $select = $select
      .split(',')
      .map((item) => item.trim())
      .filter((item, index, arr) => selects.includes(item) && arr.lastIndexOf(item) === index)
      .join(',');

    return next({
      ctx: {
        ...ctx,
        page: {
          $skip,
          $top,
          $select,
        },
      },
    });
  });
