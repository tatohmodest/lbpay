import type { Locale } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/site";
import { sealCode } from "@/lib/server/otp-link";

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
      body: "Open the button below to see your code. Use it to confirm your LBPay account. It expires in 10 minutes.",
      subject: () => "Your LBPay verification code",
      kind: "verification",
      spamTip: "💡 Tip: If this email landed in your spam or junk folder, please mark it as 'Not Spam' or move it to your inbox to ensure you receive future transaction alerts and receipts without delay.",
      footer: "If you did not create an LBPay account, ignore this email.",
    },
    admin: {
      title: "Admin access code",
      body: "Open the button below to see your code. Use it to open the LBPay admin console. It expires in 10 minutes.",
      subject: () => "Your LBPay admin code",
      kind: "admin",
      spamTip: "💡 Tip: If this email landed in spam, please mark it as 'Not Spam'.",
      footer: "If you did not request admin access, ignore this email.",
    },
    reset: {
      title: "Reset your password",
      body: "Open the button below to see your code. Use it to reset your LBPay password. It expires in 10 minutes.",
      subject: () => "Your LBPay password reset code",
      kind: "password reset",
      spamTip: "💡 Tip: If this email landed in spam, please mark it as 'Not Spam'.",
      footer: "If you did not ask to reset your password, ignore this email.",
    },
    pin: {
      title: "Reset your PIN",
      body: "Open the button below to see your code. Use it to confirm it is you, then you can set a new PIN. It expires in 10 minutes.",
      subject: () => "Your LBPay PIN reset code",
      kind: "PIN reset",
      spamTip: "💡 Tip: If this email landed in spam, please mark it as 'Not Spam'.",
      footer: "If you did not ask to reset your PIN, ignore this email.",
    },
  },
  fr: {
    verify: {
      title: "Vérifiez votre email",
      body: "Ouvrez le bouton ci-dessous pour voir votre code. Utilisez-le pour confirmer votre compte LBPay. Il expire dans 10 minutes.",
      subject: () => "Votre code de vérification LBPay",
      kind: "vérification",
      spamTip: "💡 Astuce : Si ce message est arrivé dans vos spams ou courriers indésirables, marquez-le comme 'Non spam' ou déplacez-le dans votre boîte de réception pour recevoir vos futurs reçus.",
      footer: "Si vous n'avez pas créé de compte LBPay, ignorez cet email.",
    },
    admin: {
      title: "Code d'accès admin",
      body: "Ouvrez le bouton ci-dessous pour voir votre code. Utilisez-le pour ouvrir la console admin LBPay. Il expire dans 10 minutes.",
      subject: () => "Votre code admin LBPay",
      kind: "admin",
      spamTip: "💡 Astuce : Si ce message est arrivé dans vos spams, marquez-le comme 'Non spam'.",
      footer: "Si vous n'avez pas demandé l'accès admin, ignorez cet email.",
    },
    reset: {
      title: "Réinitialiser le mot de passe",
      body: "Ouvrez le bouton ci-dessous pour voir votre code. Utilisez-le pour réinitialiser votre mot de passe LBPay. Il expire dans 10 minutes.",
      subject: () => "Votre code de réinitialisation LBPay",
      kind: "réinitialisation",
      spamTip: "💡 Astuce : Si ce message est arrivé dans vos spams, marquez-le comme 'Non spam'.",
      footer: "Si vous n'avez pas demandé à réinitialiser le mot de passe, ignorez cet email.",
    },
    pin: {
      title: "Réinitialiser le PIN",
      body: "Ouvrez le bouton ci-dessous pour voir votre code. Utilisez-le pour confirmer que c'est vous, puis choisissez un nouveau PIN. Il expire dans 10 minutes.",
      subject: () => "Votre code PIN LBPay",
      kind: "PIN",
      spamTip: "💡 Astuce : Si ce message est arrivé dans vos spams, marquez-le comme 'Non spam'.",
      footer: "Si vous n'avez pas demandé à réinitialiser le PIN, ignorez cet email.",
    },
  },
} as const;

function otpHtml(
  name: string | undefined,
  copy: { title: string; body: string; spamTip?: string; footer: string },
  link: string,
  locale: Locale,
) {
  const hello = locale === "fr" ? `Bonjour ${name || ""}`.trim() : `Hi ${name || "there"}`;
  const spamBox = copy.spamTip
    ? `<div style="margin:20px 0 0;padding:12px 16px;background:#fef7ea;border:1px solid #f9deb5;border-radius:12px;font-size:12px;color:#8a5300;line-height:1.4;">${copy.spamTip}</div>`
    : "";
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
      <div style="text-align:center;">
        <a href="${link}" style="display:inline-block;background:#00b369;color:#fff;font-weight:800;font-size:16px;text-decoration:none;padding:14px 28px;border-radius:999px;">${locale === "fr" ? "Voir mon code" : "Show my code"}</a>
      </div>
      <p style="margin:14px 0 0;font-size:12px;color:#5c6f66;text-align:center;">${locale === "fr" ? "Le lien s'ouvre sur lbpay.loopingbinary.com. LBPay ne vous demandera jamais ce code par téléphone ou WhatsApp." : "The link opens on lbpay.loopingbinary.com. LBPay will never ask you for this code by phone or WhatsApp."}</p>
      ${spamBox}
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
  // The email carries a link, never the digits: the code shows on LBPay's own page.
  const link = `${SITE_URL}/code#${sealCode(otp, purpose, Date.now() + 10 * 60 * 1000)}`;
  const html = otpHtml(name, copy, link, locale);
  const text = locale === "fr"
    ? `Ouvrez ce lien pour voir votre code LBPay (${copy.kind}). Il expire dans 10 minutes.\n\n${link}\n\n${copy.spamTip}`
    : `Open this link to see your LBPay ${copy.kind} code. It expires in 10 minutes.\n\n${link}\n\n${copy.spamTip}`;

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new MailSendError("Email is not configured.");
    }
    console.info(`[lbpay] OTP for ${to}: ${otp}`);
    return { delivered: false as const, logged: true as const };
  }

  const sent = await sendRawEmail({
    to,
    subject: copy.subject(),
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

/**
 * "Your password was changed" alert. Sent after every reset so a stolen
 * account is noticed within minutes. Failure to send never blocks the reset.
 */
export async function sendPasswordChangedEmail(to: string, name: string | undefined, locale: Locale = "en") {
  const fr = locale === "fr";
  const when = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Douala",
  }).format(new Date());
  const hello = name ? (fr ? `Bonjour ${name},` : `Hi ${name},`) : fr ? "Bonjour," : "Hi,";
  const title = fr ? "Votre mot de passe LBPay a été modifié" : "Your LBPay password was changed";
  const body = fr
    ? `${hello}\n\nLe mot de passe de votre compte LBPay a été modifié le ${when} (heure du Cameroun).\n\nSi c'était vous, vous n'avez rien à faire.\n\nSi ce n'était pas vous, répondez immédiatement à cet email ou écrivez-nous depuis l'application. Ne partagez jamais votre PIN ni vos codes : LBPay ne vous les demandera jamais.`
    : `${hello}\n\nThe password on your LBPay account was changed on ${when} (Cameroon time).\n\nIf this was you, there's nothing else to do.\n\nIf it wasn't you, reply to this email right away or message us from the app. Never share your PIN or codes: LBPay will never ask for them.`;
  const html = supportShell(
    title,
    fr ? "Alerte de sécurité" : "Security alert",
    body,
    `${SITE_URL}/security`,
    fr ? "Comment nous protégeons votre compte" : "How we protect your account",
  );
  return sendRawEmail({ to, subject: title, html, text: body });
}
