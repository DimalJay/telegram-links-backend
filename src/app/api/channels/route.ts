import { NextResponse } from "next/server";

import { listLinks } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listLinks({ type: "channel" });
  return NextResponse.json({ items });
}
