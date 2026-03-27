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
  const result = await listLinksPaginated({ type: "group", page, limit });
  return NextResponse.json(result, { headers: getCorsHeaders() });
}
