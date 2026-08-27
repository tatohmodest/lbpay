import { NextResponse } from "next/server";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function catchRoute(scope: string, err: unknown) {
  console.error(`[lbpay] ${scope} failed`, err);
  const message = err instanceof Error ? err.message : "";
  if (
    /not configured|SESSION_SECRET|EMAIL_FROM|SMTP_|PAYUNIT_|CLOUDINARY_|required/i.test(message)
  ) {
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
