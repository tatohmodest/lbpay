function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function isWorkersRuntime() {
  return (
    (typeof navigator !== "undefined" && /Cloudflare-Workers/i.test(String(navigator.userAgent || ""))) ||
    typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function"
  );
}

type SocketLike = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  startTls?: () => SocketLike;
  close?: () => void;
};

async function openSocket(host: string, port: number, secureTransport: "off" | "on" | "starttls"): Promise<SocketLike> {
  const specifier = ["cloudflare", "sockets"].join(":");
  const mod = (await import(/* webpackIgnore: true */ specifier)) as {
    connect: (
      address: { hostname: string; port: number },
      options?: { secureTransport?: "off" | "on" | "starttls" },
    ) => SocketLike;
  };
  return mod.connect({ hostname: host, port }, { secureTransport });
}

class SmtpSession {
  private socket: SocketLike;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private leftover = "";
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();

  constructor(socket: SocketLike) {
    this.socket = socket;
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
  }

  async upgradeTls() {
    await this.writer.close().catch(() => undefined);
    this.reader.releaseLock();
    if (!this.socket.startTls) throw new Error("SMTP STARTTLS is not available.");
    this.socket = this.socket.startTls();
    this.writer = this.socket.writable.getWriter();
    this.reader = this.socket.readable.getReader();
    this.leftover = "";
  }

  async writeLine(line: string) {
    await this.writer.write(new TextEncoder().encode(`${line}\r\n`));
  }

  async readReply() {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      lines.push(line);
      if (line.length < 4 || line[3] === " ") {
        const code = Number(line.slice(0, 3));
        return { code, lines, text: lines.join("\n") };
      }
    }
  }

  private async readLine() {
    while (!this.leftover.includes("\n")) {
      const chunk = await Promise.race([
        this.reader.read(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("SMTP timed out.")), 12_000);
        }),
      ]);
      if (chunk.done) throw new Error("SMTP closed the connection.");
      this.leftover += this.decoder.decode(chunk.value, { stream: true });
    }
    const idx = this.leftover.indexOf("\n");
    const line = this.leftover.slice(0, idx).replace(/\r$/, "");
    this.leftover = this.leftover.slice(idx + 1);
    return line;
  }

  async close() {
    try {
      await this.writeLine("QUIT");
    } catch {
      /* ignore */
    }
    try {
      this.socket.close?.();
    } catch {
      /* ignore */
    }
  }
}

function parseFrom(from: string) {
  const match = from.match(/<([^>]+)>/);
  return match?.[1] || from;
}

export async function sendSmtpOverSockets(input: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!isWorkersRuntime()) {
    throw new Error("SMTP sockets are only available on Cloudflare Workers.");
  }
  const port = input.port || (input.secure ? 465 : 587);
  const startSecure = input.secure || port === 465;
  const session = new SmtpSession(await openSocket(input.host, port, startSecure ? "on" : "starttls"));
  try {
    const greet = await session.readReply();
    if (greet.code !== 220) throw new Error(greet.text || "SMTP greeting failed.");
    await session.writeLine(`EHLO lbpay.cm`);
    const ehlo = await session.readReply();
    if (ehlo.code !== 250) throw new Error(ehlo.text || "SMTP EHLO failed.");
    if (!startSecure) {
      await session.writeLine("STARTTLS");
      const tls = await session.readReply();
      if (tls.code !== 220) throw new Error(tls.text || "SMTP STARTTLS failed.");
      await session.upgradeTls();
      await session.writeLine(`EHLO lbpay.cm`);
      const ehlo2 = await session.readReply();
      if (ehlo2.code !== 250) throw new Error(ehlo2.text || "SMTP EHLO failed.");
    }
    await session.writeLine("AUTH LOGIN");
    const auth = await session.readReply();
    if (auth.code !== 334) throw new Error(auth.text || "SMTP AUTH was rejected.");
    await session.writeLine(encodeBase64(input.user));
    const userReply = await session.readReply();
    if (userReply.code !== 334) throw new Error(userReply.text || "SMTP username was rejected.");
    await session.writeLine(encodeBase64(input.pass));
    const passReply = await session.readReply();
    if (passReply.code !== 235) throw new Error(passReply.text || "SMTP login failed.");
    const from = parseFrom(input.from);
    await session.writeLine(`MAIL FROM:<${from}>`);
    const mailFrom = await session.readReply();
    if (mailFrom.code !== 250) throw new Error(mailFrom.text || "SMTP MAIL FROM failed.");
    await session.writeLine(`RCPT TO:<${input.to}>`);
    const rcpt = await session.readReply();
    if (rcpt.code !== 250) throw new Error(rcpt.text || "SMTP RCPT TO failed.");
    await session.writeLine("DATA");
    const data = await session.readReply();
    if (data.code !== 354) throw new Error(data.text || "SMTP DATA failed.");
    const payload = [
      `From: ${input.from}`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="lbpay-otp"',
      "",
      "--lbpay-otp",
      "Content-Type: text/plain; charset=utf-8",
      "",
      input.text,
      "--lbpay-otp",
      "Content-Type: text/html; charset=utf-8",
      "",
      input.html,
      "--lbpay-otp--",
      ".",
    ].join("\r\n");
    await session.writeLine(payload);
    const sent = await session.readReply();
    if (sent.code !== 250) throw new Error(sent.text || "SMTP could not send the message.");
  } finally {
    await session.close();
  }
}

export { isWorkersRuntime };
