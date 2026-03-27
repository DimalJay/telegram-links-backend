import { NextResponse } from "next/server";

import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";
import { listLinks } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  const items = await listLinks({ type: "channel" });
  return NextResponse.json({ items }, { headers: getCorsHeaders() });
}
