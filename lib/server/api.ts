import { NextResponse } from "next/server";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function catchRoute(scope: string, err: unknown) {
  console.error(`[lbpay] ${scope} failed`, err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again in a few minutes." },
    { status: 500 },
  );
}
