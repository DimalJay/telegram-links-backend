import { NextRequest, NextResponse } from "next/server";

import { addLink, validateCreateInput } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const validated = validateCreateInput(body as any);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const created = await addLink(validated.value);
  if (!created.ok) {
    return NextResponse.json(
      { error: "duplicate link", existing: created.existing },
      { status: 409 },
    );
  }

  return NextResponse.json({ item: created.created }, { status: 201 });
}
