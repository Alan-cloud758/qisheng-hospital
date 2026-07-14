export function parsePagination(query: Record<string, unknown>) {
  const rawPage = Number(query.page ?? 1)
  const rawPageSize = Number(query.pageSize ?? 20)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(rawPageSize) ? Math.floor(rawPageSize) : 20))

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function parseKeyword(query: Record<string, unknown>) {
  return typeof query.keyword === 'string' && query.keyword.trim() ? query.keyword.trim() : undefined
}

export function parseDateRange(query: Record<string, unknown>) {
  const gte = typeof query.startDate === 'string' ? new Date(query.startDate) : undefined
  const lte = typeof query.endDate === 'string' ? new Date(query.endDate) : undefined

  return {
    gte: gte && !Number.isNaN(gte.getTime()) ? gte : undefined,
    lte: lte && !Number.isNaN(lte.getTime()) ? lte : undefined,
  }
}
