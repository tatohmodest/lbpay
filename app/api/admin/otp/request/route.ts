import { NextResponse } from "next/server";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { saveOtp } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";
import { isAdmin } from "@/lib/roles";

export async function POST() {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error!;
  if (!isAdmin(auth.user)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const otp = randomOtp();
  await saveOtp({
    email: `admin:${auth.user.email}`,
    hash: await hashSecret(otp),
    exp: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  const mail = await sendOtpEmail(auth.user.email, otp, auth.user.name, "admin");
  return NextResponse.json({
    ok: true,
    delivered: mail.delivered,
    devOtp: mail.delivered ? undefined : otp,
  });
}
