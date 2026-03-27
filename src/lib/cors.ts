import { NextResponse } from "next/server";

export function getCorsHeaders() {
  const origin = process.env.CORS_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function corsOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
}
