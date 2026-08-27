import nodemailer from "nodemailer";

function smtpPort() {
  return Number(process.env.SMTP_PORT || 587);
}

function smtpSecure() {
  if (process.env.SMTP_SECURE === "true") return true;
  if (process.env.SMTP_SECURE === "false") return smtpPort() === 465;
  return smtpPort() === 465;
}

function fromAddress() {
  const value = process.env.SMTP_FROM || process.env.EMAIL_FROM;
  if (!value) {
    throw new Error("Set EMAIL_FROM or SMTP_FROM.");
  }
  return value;
}

function transport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
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

export async function sendOtpEmail(
  to: string,
  otp: string,
  name?: string,
  purpose: "verify" | "admin" = "verify",
) {
  const title = purpose === "admin" ? "Admin access code" : "Verify your email";
  const body =
    purpose === "admin"
      ? "Use this code to open the LBPay admin console. It expires in 10 minutes."
      : "Use this code to confirm your LBPay account. It expires in 10 minutes.";
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f3faf6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#0f1f17;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #d7e8de;">
    <div style="background:#00b369;color:#fff;padding:24px 28px;">
      <div style="font-weight:900;font-size:22px;">LBPay</div>
      <div style="opacity:.9;font-size:13px;margin-top:4px;">${title}</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 12px;">Hi ${name || "there"},</p>
      <p style="margin:0 0 20px;color:#5c6f66;">${body}</p>
      <div style="letter-spacing:10px;font-size:32px;font-weight:800;text-align:center;background:#e6f8ef;color:#007a47;padding:16px;border-radius:16px;">${otp}</div>
      <p style="margin:20px 0 0;font-size:12px;color:#5c6f66;">If you did not create an LBPay account, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  const mailer = transport();
  if (!mailer) {
    throw new Error("Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.");
  }

  await mailer.sendMail({
    from: fromAddress(),
    to,
    subject: purpose === "admin" ? `${otp} is your LBPay admin code` : `${otp} is your LBPay verification code`,
    html,
    text: `Your LBPay ${purpose === "admin" ? "admin" : "verification"} code is ${otp}. It expires in 10 minutes.`,
  });
  return { delivered: true as const };
}
