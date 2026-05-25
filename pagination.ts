// =============================================================================
//  Pagination Helper
//  packages/database/src/helpers/pagination.ts
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Compute skip/take for Prisma from page/limit params */
export function getPaginationArgs(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

/** Build the meta object to attach to paginated API responses */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Convenience: run count + findMany in a transaction and return paginated result */
export async function paginate<T>(
  countFn: () => Promise<number>,
  findFn: () => Promise<T[]>,
  page: number,
  limit: number
): Promise<PaginatedResult<T>> {
  const [total, data] = await Promise.all([countFn(), findFn()]);
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}
