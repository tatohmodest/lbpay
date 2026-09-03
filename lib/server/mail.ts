import type { Locale } from "@/lib/i18n/locale";

function isWorkersRuntime() {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function";
}

function smtpPort() {
  return Number(process.env.SMTP_PORT || 587);
}

function smtpSecure() {
  if (process.env.SMTP_SECURE === "true") return true;
  if (process.env.SMTP_SECURE === "false") return smtpPort() === 465;
  return smtpPort() === 465;
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.RESEND_FROM || "";
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && fromAddress());
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && fromAddress());
}

function brevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY && fromAddress());
}

export function mailConfigured() {
  return smtpConfigured() || resendConfigured() || brevoConfigured();
}

async function nodeTransport() {
  if (!smtpConfigured()) return null;
  const nodemailer = (await import("nodemailer")).default;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: smtpSecure(),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 8_000,
  });
}

const OTP_COPY = {
  en: {
    verify: {
      title: "Verify your email",
      body: "Use this code to confirm your LBPay account. It expires in 10 minutes.",
      subject: (otp: string) => `${otp} is your LBPay verification code`,
      kind: "verification",
      footer: "If you did not create an LBPay account, ignore this email.",
    },
    admin: {
      title: "Admin access code",
      body: "Use this code to open the LBPay admin console. It expires in 10 minutes.",
      subject: (otp: string) => `${otp} is your LBPay admin code`,
      kind: "admin",
      footer: "If you did not request admin access, ignore this email.",
    },
    reset: {
      title: "Reset your password",
      body: "Use this code to reset your LBPay password. It expires in 10 minutes.",
      subject: (otp: string) => `${otp} is your LBPay password reset code`,
      kind: "password reset",
      footer: "If you did not ask to reset your password, ignore this email.",
    },
    pin: {
      title: "Reset your PIN",
      body: "Use this code to confirm it is you, then you can set a new PIN. It expires in 10 minutes.",
      subject: (otp: string) => `${otp} is your LBPay PIN reset code`,
      kind: "PIN reset",
      footer: "If you did not ask to reset your PIN, ignore this email.",
    },
  },
  fr: {
    verify: {
      title: "Vérifiez votre email",
      body: "Utilisez ce code pour confirmer votre compte LBPay. Il expire dans 10 minutes.",
      subject: (otp: string) => `${otp} est votre code de vérification LBPay`,
      kind: "vérification",
      footer: "Si vous n'avez pas créé de compte LBPay, ignorez cet email.",
    },
    admin: {
      title: "Code d'accès admin",
      body: "Utilisez ce code pour ouvrir la console admin LBPay. Il expire dans 10 minutes.",
      subject: (otp: string) => `${otp} est votre code admin LBPay`,
      kind: "admin",
      footer: "Si vous n'avez pas demandé l'accès admin, ignorez cet email.",
    },
    reset: {
      title: "Réinitialiser le mot de passe",
      body: "Utilisez ce code pour réinitialiser votre mot de passe LBPay. Il expire dans 10 minutes.",
      subject: (otp: string) => `${otp} est votre code de réinitialisation LBPay`,
      kind: "réinitialisation",
      footer: "Si vous n'avez pas demandé à réinitialiser le mot de passe, ignorez cet email.",
    },
    pin: {
      title: "Réinitialiser le PIN",
      body: "Utilisez ce code pour confirmer que c'est vous, puis choisissez un nouveau PIN. Il expire dans 10 minutes.",
      subject: (otp: string) => `${otp} est votre code PIN LBPay`,
      kind: "PIN",
      footer: "Si vous n'avez pas demandé à réinitialiser le PIN, ignorez cet email.",
    },
  },
} as const;

function otpHtml(
  name: string | undefined,
  copy: { title: string; body: string; footer: string },
  otp: string,
  locale: Locale,
) {
  const hello = locale === "fr" ? `Bonjour ${name || ""}`.trim() : `Hi ${name || "there"}`;
  return `<!doctype html>
<html>
<body style="margin:0;background:#f3faf6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#0f1f17;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #d7e8de;">
    <div style="background:#00b369;color:#fff;padding:24px 28px;">
      <div style="font-weight:900;font-size:22px;">LBPay</div>
      <div style="opacity:.9;font-size:13px;margin-top:4px;">${copy.title}</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 12px;">${hello},</p>
      <p style="margin:0 0 20px;color:#5c6f66;">${copy.body}</p>
      <div style="letter-spacing:10px;font-size:32px;font-weight:800;text-align:center;background:#e6f8ef;color:#007a47;padding:16px;border-radius:16px;">${otp}</div>
      <p style="margin:20px 0 0;font-size:12px;color:#5c6f66;">${copy.footer}</p>
    </div>
  </div>
</body>
</html>`;
}

export class MailSendError extends Error {
  constructor(message = "We could not send the verification email.") {
    super(message);
    this.name = "MailSendError";
  }
}

async function sendResend(input: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: input.to.split(",").map((item) => item.trim()).filter(Boolean),
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MailSendError(body.slice(0, 180) || "Resend rejected the email.");
  }
}

async function sendBrevo(input: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromAddress() },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MailSendError(body.slice(0, 180) || "Brevo rejected the email.");
  }
}

async function sendSmtp(input: { to: string; subject: string; html: string; text: string }) {
  if (isWorkersRuntime()) {
    throw new MailSendError("SMTP is not available on Cloudflare Workers. Set RESEND_API_KEY or BREVO_API_KEY.");
  }
  const mailer = await nodeTransport();
  if (!mailer) throw new MailSendError("Email is not configured.");
  await mailer.sendMail({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendRawEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ delivered: boolean; error?: string }> {
  const to = Array.isArray(input.to) ? input.to.filter(Boolean).join(", ") : input.to;
  if (!to) return { delivered: false, error: "No recipient." };
  if (!mailConfigured()) return { delivered: false, error: "Email is not configured." };
  try {
    const first = to.split(",")[0]!.trim();
    const payload = { to: first, subject: input.subject, html: input.html, text: input.text };
    if (resendConfigured()) await sendResend({ ...payload, to });
    else if (brevoConfigured()) await sendBrevo(payload);
    else await sendSmtp(payload);
    return { delivered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send email.";
    console.error("[lbpay] mail send failed", message);
    return { delivered: false, error: message };
  }
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  name?: string,
  purpose: "verify" | "admin" | "reset" | "pin" = "verify",
  locale: Locale = "en",
) {
  const copy = OTP_COPY[locale === "fr" ? "fr" : "en"][purpose];
  const html = otpHtml(name, copy, otp, locale);
  const text = locale === "fr"
    ? `Votre code LBPay (${copy.kind}) est ${otp}. Il expire dans 10 minutes.`
    : `Your LBPay ${copy.kind} code is ${otp}. It expires in 10 minutes.`;

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new MailSendError("Email is not configured.");
    }
    console.info(`[lbpay] OTP for ${to}: ${otp}`);
    return { delivered: false as const, logged: true as const };
  }

  const sent = await sendRawEmail({
    to,
    subject: copy.subject(otp),
    html,
    text,
  });
  if (!sent.delivered) {
    throw new MailSendError(sent.error || "Could not send email.");
  }
  return { delivered: true as const };
}

function supportShell(title: string, intro: string, body: string, href: string, cta: string) {
  const safeBody = body.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html>
<body style="margin:0;background:#f3faf6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#0f1f17;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #d7e8de;">
    <div style="background:#00b369;color:#fff;padding:24px 28px;">
      <div style="font-weight:900;font-size:22px;">LBPay</div>
      <div style="opacity:.9;font-size:13px;margin-top:4px;">${title}</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 12px;color:#5c6f66;">${intro}</p>
      <div style="background:#e6f8ef;border-radius:16px;padding:16px;white-space:pre-wrap;line-height:1.5;">${safeBody}</div>
      <p style="margin:20px 0 0;">
        <a href="${href}" style="color:#007a47;font-weight:700;">${cta}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendHtmlEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ delivered: boolean; error?: string }> {
  return sendRawEmail(input);
}

export async function sendSupportNotice(input: {
  to: string | string[];
  title: string;
  intro: string;
  body: string;
  href: string;
  cta: string;
  replyTo?: string;
}) {
  const html = supportShell(input.title, input.intro, input.body, input.href, input.cta);
  return sendHtmlEmail({
    to: input.to,
    subject: input.title,
    html,
    text: `${input.intro}\n\n${input.body}\n\n${input.href}`,
    replyTo: input.replyTo,
  });
}
