import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { saveOtp } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";
import { isAdmin } from "@/lib/roles";

export async function POST() {
  try {
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
    await sendOtpEmail(auth.user.email, otp, auth.user.name, "admin");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("admin-otp-request", error);
  }
}
