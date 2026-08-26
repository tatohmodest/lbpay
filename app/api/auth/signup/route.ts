import { NextResponse } from "next/server";
import { findUserByEmail, findUserByHandle, saveOtp, upsertUser } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { setPreauth } from "@/lib/server/session";
import { slugify, uid } from "@/lib/format";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\s+/g, "");
  const password = String(body.password || "");
  let handle = slugify(String(body.lbpayId || name || email.split("@")[0]));

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "Name, email, and a password of 6+ characters are required." }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing?.emailVerified) {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
  }

  const taken = await findUserByHandle(handle || "x");
  if (taken && taken.email !== email) {
    handle = `${handle || "user"}${Math.floor(10 + Math.random() * 89)}`;
  }

  const user = existing ?? {
    id: uid("usr"),
    name,
    lbpayId: handle || uid("id"),
    email,
    phone,
    avatar: "/illustrations/empty-wallet.png",
    passwordHash: await hashSecret(password),
    pinHash: null,
    emailVerified: false,
    kycStatus: "unverified" as const,
    createdAt: new Date().toISOString(),
  };
  if (!existing) await upsertUser(user);
  else {
    user.name = name;
    user.phone = phone;
    user.passwordHash = await hashSecret(password);
    await upsertUser(user);
  }

  const otp = randomOtp();
  await saveOtp({
    email,
    hash: await hashSecret(otp),
    exp: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  const mail = await sendOtpEmail(email, otp, name);
  await setPreauth(user.id, "otp");

  return NextResponse.json({
    ok: true,
    step: "otp",
    email,
    delivered: mail.delivered,
    devOtp: mail.delivered ? undefined : otp,
  });
}
