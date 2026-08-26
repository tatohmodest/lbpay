import { NextResponse } from "next/server";
import { findUserByEmail, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const otp = randomOtp();
  await saveOtp({
    email,
    hash: await hashSecret(otp),
    exp: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  const mail = await sendOtpEmail(email, otp, user.name);
  return NextResponse.json({
    ok: true,
    delivered: mail.delivered,
    devOtp: mail.delivered ? undefined : otp,
  });
}
