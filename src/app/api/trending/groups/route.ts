import { NextRequest, NextResponse } from "next/server";

import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";
import { parsePagination } from "@/lib/pagination";
import { listLinksPaginated } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  const { page, limit } = parsePagination(request.nextUrl.searchParams);
  const filterParam = request.nextUrl.searchParams.get("filter") ?? "trending";
  const filter = filterParam === "trending" || filterParam === "latest" || filterParam === "hot"
    ? filterParam
    : null;
  if (!filter) {
    return NextResponse.json(
      { error: "filter must be one of: trending, latest, hot" },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  // NOTE: The algorithm for "trending" and "hot" will be defined later.
  // For now, all filters return the newest-first listing.
  const result = await listLinksPaginated({ type: "group", page, limit });
  return NextResponse.json(result, { headers: getCorsHeaders() });
}
