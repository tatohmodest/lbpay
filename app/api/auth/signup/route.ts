import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import {
  findUserByEmail,
  isHandleTaken,
  nextAvailableHandle,
  saveOtp,
  upsertUser,
} from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { MailSendError, mailConfigured, sendOtpEmail } from "@/lib/server/mail";
import { applyPreauthCookie } from "@/lib/server/session";
import { defaultKyc, isBootstrapAdmin } from "@/lib/roles";
import { uid } from "@/lib/format";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { isReservedHandle, normalizeHandle } from "@/lib/handle";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import type { AccountKind } from "@/lib/types";
import { localeFromRequest } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";

export async function POST(request: Request) {
  const locale = localeFromRequest(request);
  const t = (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars);
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = cameroonMsisdn(body.phone);
    const password = String(body.password || "");
    const requested = normalizeHandle(String(body.lbpayId || name || email.split("@")[0]));

    if (!name || !email || !password || password.length < 6) {
      return jsonError(t("errors.requiredSignup"));
    }
    if (!isCameroonMsisdn(phone)) {
      return jsonError(t("errors.phone"));
    }
    if (!requested || requested.length < 2) {
      return jsonError(t("errors.handleShort"));
    }
    const existing = await findUserByEmail(email);
    if (existing?.emailVerified) {
      return jsonError(t("errors.emailExists"), 409);
    }

    if (isReservedHandle(requested) || (await isHandleTaken(requested, existing?.id))) {
      const suggestion = await nextAvailableHandle(requested, existing?.id);
      return NextResponse.json(
        {
          error: t("errors.handleTaken", { handle: requested, suggestion }),
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
      avatar: DEFAULT_AVATAR,
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

    const skipEmail = !mailConfigured() && process.env.NODE_ENV !== "production";
    if (skipEmail) {
      user.emailVerified = true;
    }

    try {
      await upsertUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/already taken/i.test(message)) {
        const suggestion = await nextAvailableHandle(handle, user.id);
        return NextResponse.json(
          {
            error: t("errors.handleTaken", { handle, suggestion }),
            suggestion,
          },
          { status: 409 },
        );
      }
      throw err;
    }

    if (skipEmail) {
      const response = NextResponse.json({
        ok: true,
        step: user.pinHash ? "pin" : "pin-setup",
        email,
        lbpayId: handle,
      });
      applyPreauthCookie(response, user.id, user.pinHash ? "pin" : "pin-setup");
      return response;
    }

    const otp = randomOtp();
    await saveOtp({
      email,
      hash: await hashSecret(otp),
      exp: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    try {
      await sendOtpEmail(email, otp, name, "verify", locale);
    } catch (err) {
      console.error("[lbpay] signup mail failed", err);
      return jsonError(t("errors.emailSend"), 503);
    }
    const response = NextResponse.json({
      ok: true,
      step: "otp",
      email,
      lbpayId: handle,
    });
    applyPreauthCookie(response, user.id, "otp");
    return response;
  } catch (error) {
    if (error instanceof MailSendError) {
      return jsonError(t("errors.emailSend"), 503);
    }
    return catchRoute("signup", error);
  }
}
