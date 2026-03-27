import { NextRequest, NextResponse } from "next/server";

import { searchLinks } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";
  const query = normalize(raw);

  if (!query) {
    return NextResponse.json(
      { error: "query is required (use ?query=... or ?q=...)" },
      { status: 400 },
    );
  }

  const typeParam = url.searchParams.get("type");
  const type = typeParam === "group" || typeParam === "channel" ? typeParam : null;

  const items = await searchLinks({ query, type: type ?? undefined });
  return NextResponse.json({ items });
}
