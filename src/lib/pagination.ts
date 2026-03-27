export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export function parsePagination(searchParams: URLSearchParams, defaults?: {
  page?: number;
  limit?: number;
  maxLimit?: number;
}): PaginationParams {
  const defaultPage = defaults?.page ?? 1;
  const defaultLimit = defaults?.limit ?? 20;
  const maxLimit = defaults?.maxLimit ?? 100;

  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");

  const pageParsed = pageRaw ? Number(pageRaw) : defaultPage;
  const limitParsed = limitRaw ? Number(limitRaw) : defaultLimit;

  const page = Number.isFinite(pageParsed) ? Math.floor(pageParsed) : defaultPage;
  const limit = Number.isFinite(limitParsed) ? Math.floor(limitParsed) : defaultLimit;

  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(maxLimit, limit));
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
}
