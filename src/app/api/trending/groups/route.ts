import { NextResponse } from "next/server";

import { listLinks } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listLinks({ type: "group", limit: 10 });
  return NextResponse.json({ items });
}
