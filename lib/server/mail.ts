import nodemailer from "nodemailer";

function transport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(to: string, otp: string, name?: string) {
  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f3faf6;font-family:Inter,Arial,sans-serif;color:#0f1f17;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #d7e8de;">
    <div style="background:#00b369;color:#fff;padding:24px 28px;">
      <div style="font-weight:900;font-size:22px;">LBPay</div>
      <div style="opacity:.9;font-size:13px;margin-top:4px;">Verify your email</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 12px;">Hi ${name || "there"},</p>
      <p style="margin:0 0 20px;color:#5c6f66;">Use this code to confirm your LBPay account. It expires in 10 minutes.</p>
      <div style="letter-spacing:10px;font-size:32px;font-weight:800;text-align:center;background:#e6f8ef;color:#007a47;padding:16px;border-radius:16px;">${otp}</div>
      <p style="margin:20px 0 0;font-size:12px;color:#5c6f66;">If you did not create an LBPay account, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  const mailer = transport();
  if (!mailer) {
    console.info(`[lbpay] SMTP not configured. OTP for ${to}: ${otp}`);
    return { delivered: false, otp };
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || "LBPay <noreply@lbpay.cm>",
    to,
    subject: `${otp} is your LBPay verification code`,
    html,
    text: `Your LBPay verification code is ${otp}. It expires in 10 minutes.`,
  });
  return { delivered: true };
}
