/**
 * Parse and validate pagination parameters from URL search params.
 *
 * Clamps `page` to >= 1 and `limit` to [1, maxLimit] to prevent
 * resource exhaustion from extreme values.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): { page: number; limit: number; from: number; to: number } {
  const { page: defaultPage = 1, limit: defaultLimit = 20, maxLimit = 100 } = defaults

  const page = Math.max(Math.floor(Number(searchParams.get('page')) || defaultPage), 1)
  const limit = Math.min(
    Math.max(Math.floor(Number(searchParams.get('limit')) || defaultLimit), 1),
    maxLimit
  )

  return {
    page,
    limit,
    from: (page - 1) * limit,
    to: page * limit - 1,
  }
}

/**
 * Build a standard pagination response object.
 */
export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
