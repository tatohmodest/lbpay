import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import {
  findUserByEmail,
  findUserByHandle,
  nextAvailableHandle,
  saveOtp,
  upsertUser,
} from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { setPreauth } from "@/lib/server/session";
import { defaultKyc, isBootstrapAdmin } from "@/lib/roles";
import { uid } from "@/lib/format";
import { isReservedHandle, normalizeHandle } from "@/lib/handle";
import { cameroonMsisdn } from "@/lib/phone";
import type { AccountKind } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = cameroonMsisdn(body.phone);
    const password = String(body.password || "");
    const requested = normalizeHandle(String(body.lbpayId || name || email.split("@")[0]));

    if (!name || !email || !password || password.length < 6) {
      return jsonError("Name, email, and a password of 6+ characters are required.");
    }
    if (!requested || requested.length < 2) {
      return jsonError("Choose an LBPay ID of at least 2 characters.");
    }
    if (isReservedHandle(requested)) {
      return jsonError("That LBPay ID is reserved. Choose another.");
    }

    const existing = await findUserByEmail(email);
    if (existing?.emailVerified) {
      return jsonError("An account already exists for this email.", 409);
    }

    const taken = await findUserByHandle(requested);
    if (taken && taken.email !== email) {
      const suggestion = await nextAvailableHandle(requested, existing?.id);
      return NextResponse.json(
        {
          error: `@${requested} is already taken. @${suggestion} is free.`,
          suggestion,
        },
        { status: 409 },
      );
    }

    const handle = requested;
    const user = existing ?? {
      id: uid("usr"),
      name,
      lbpayId: handle,
      email,
      phone,
      avatar: "/illustrations/empty-wallet.png",
      passwordHash: "",
      pinHash: null,
      emailVerified: false,
      kycStatus: "unverified" as const,
      roles: (isBootstrapAdmin(email) ? ["personal", "admin"] : ["personal"]) as AccountKind[],
      status: "active" as const,
      kyc: defaultKyc(),
      createdAt: new Date().toISOString(),
    };
    user.name = name;
    user.phone = phone;
    user.lbpayId = handle;
    user.passwordHash = await hashSecret(password);
    await upsertUser(user);

    const otp = randomOtp();
    await saveOtp({
      email,
      hash: await hashSecret(otp),
      exp: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    await sendOtpEmail(email, otp, name);
    await setPreauth(user.id, "otp");

    return NextResponse.json({
      ok: true,
      step: "otp",
      email,
      lbpayId: handle,
    });
  } catch (error) {
    return catchRoute("signup", error);
  }
}
