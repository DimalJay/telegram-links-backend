import { NextRequest, NextResponse } from "next/server";

import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";
import { addLink, validateCreateInput } from "@/lib/telegramLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON" },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  const validated = validateCreateInput(body as any);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: 400, headers: getCorsHeaders() },
    );
  }

  const created = await addLink(validated.value);
  if (!created.ok) {
    return NextResponse.json(
      { error: "duplicate link", existing: created.existing },
      { status: 409, headers: getCorsHeaders() },
    );
  }

  return NextResponse.json(
    { item: created.created },
    { status: 201, headers: getCorsHeaders() },
  );
}
