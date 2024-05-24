/**
 * Paginable list
 */
export interface IPaginable<T = unknown> {
  value: T[];
  top: number;
  skip: number;
  count: number;
}

export type PaginationQuery<T extends number | string = number> = Partial<{
  $skip: T;
  $top: T;
  $select: string;
}>;
