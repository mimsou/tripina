import { NextResponse } from "next/server";

/** Health check for load balancers (e.g. Render). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
