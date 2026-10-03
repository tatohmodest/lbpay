import { MAX_KYC_UPLOAD_BYTES, type KycImageKind } from "@/lib/kyc";
import { uid } from "@/lib/format";

export function r2AccountId(): string {
  return String(process.env.R2_ACCOUNT_ID || "").trim();
}

export function r2Bucket(): string {
  return String(process.env.R2_BUCKET || "lbpay").trim();
}

export function r2PublicUrl(): string {
  const url =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://pub-98c2191bb9e1446f9eafa841d5d5be11.r2.dev";
  return String(url).trim().replace(/\/$/, "");
}

export function r2Endpoint(): string {
  const custom = String(process.env.R2_S3_ENDPOINT || "").trim();
  if (custom) return custom;
  const accountId = r2AccountId();
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "";
}

export function r2Configured(): boolean {
  return Boolean(
    r2Endpoint() &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      r2Bucket(),
  );
}

export function isOurR2Url(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const publicBase = r2PublicUrl();
    if (publicBase) {
      try {
        if (parsed.hostname === new URL(publicBase).hostname) return true;
      } catch {
        /* ignore */
      }
    }
    return parsed.hostname.endsWith(".r2.dev") || parsed.hostname.endsWith(".r2.cloudflarestorage.com");
  } catch {
    return false;
  }
}

export function r2Key(urlOrKey: string | null | undefined): string | null {
  const raw = String(urlOrKey || "").trim();
  if (!raw) return null;
  if (!raw.includes("://")) {
    const clean = raw.replace(/^\/+/, "");
    return clean || null;
  }
  try {
    const parsed = new URL(raw);
    const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

function mimeToExtension(mime: string): string {
  const clean = mime.toLowerCase();
  if (clean.includes("png")) return "png";
  if (clean.includes("webp")) return "webp";
  if (clean.includes("gif")) return "gif";
  if (clean.includes("svg")) return "svg";
  return "jpg";
}

function hex(buffer: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeRfc3986(part))
    .join("/");
}

function bytesOf(data: Uint8Array) {
  return Uint8Array.from(data);
}

async function sha256Hex(data: Uint8Array | string) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : bytesOf(data);
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

async function hmac(key: BufferSource, data: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data)));
}

async function signingKey(secret: string, date: string, region: string, service: string) {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

async function signedR2Request(input: {
  method: "PUT" | "DELETE";
  key: string;
  body?: Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}) {
  if (!r2Configured()) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }
  const endpoint = new URL(r2Endpoint());
  const key = input.key.replace(/^\/+/, "");
  const path = `/${encodePath(r2Bucket())}/${encodePath(key)}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const accessKey = String(process.env.R2_ACCESS_KEY_ID).trim();
  const secretKey = String(process.env.R2_SECRET_ACCESS_KEY).trim();
  const payload = input.body ? bytesOf(input.body) : new Uint8Array();
  const payloadHash = await sha256Hex(payload);
  const headers: Record<string, string> = {
    host: endpoint.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (input.contentType) headers["content-type"] = input.contentType;
  for (const [name, value] of Object.entries(input.metadata || {})) {
    if (!value) continue;
    headers[`x-amz-meta-${name.toLowerCase()}`] = value;
  }
  const signedNames = Object.keys(headers).sort();
  const canonicalHeaders = signedNames.map((name) => `${name}:${headers[name]}\n`).join("");
  const signedHeaderList = signedNames.join(";");
  const canonical = [
    input.method,
    path,
    "",
    canonicalHeaders,
    signedHeaderList,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(canonical)].join("\n");
  const signature = hex(await signingKey(secretKey, dateStamp, region, service).then((keyBytes) => hmac(keyBytes, stringToSign)));
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaderList}, Signature=${signature}`;

  const res = await fetch(`${endpoint.origin}${path}`, {
    method: input.method,
    headers,
    body: input.body ? payload : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail.slice(0, 180) || `R2 ${input.method} failed (${res.status}).`);
  }
}

export async function uploadToR2(input: {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; key: string; bytes: number }> {
  const cleanKey = input.key.replace(/^\/+/, "");
  const bytes = input.buffer.byteLength;
  const body = input.buffer instanceof Uint8Array ? input.buffer : new Uint8Array(input.buffer);
  await signedR2Request({
    method: "PUT",
    key: cleanKey,
    body,
    contentType: input.contentType,
    metadata: input.metadata,
  });
  return {
    url: `${r2PublicUrl()}/${cleanKey}`,
    key: cleanKey,
    bytes,
  };
}

export async function deleteFromR2(urlOrKey: string | null | undefined): Promise<boolean> {
  const key = r2Key(urlOrKey);
  if (!key) return false;
  try {
    await signedR2Request({ method: "DELETE", key });
    return true;
  } catch (error) {
    console.error("[lbpay] R2 delete failed", error);
    return false;
  }
}

export async function uploadKycImageR2(input: {
  buffer: Buffer;
  userId: string;
  kind: KycImageKind;
  mime: string;
}) {
  if (input.buffer.byteLength > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }
  const ext = mimeToExtension(input.mime);
  const key = `kyc/${input.userId}/${input.kind}-${Date.now()}-${uid("img")}.${ext}`;
  const res = await uploadToR2({
    key,
    buffer: input.buffer,
    contentType: input.mime || "image/jpeg",
    metadata: {
      userId: input.userId,
      kind: input.kind,
      service: "lbpay-kyc",
    },
  });
  return { url: res.url, publicId: res.key, bytes: res.bytes };
}

export async function uploadProductImageR2(input: {
  buffer: Buffer;
  userId: string;
  mime: string;
}) {
  if (input.buffer.byteLength > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }
  const ext = mimeToExtension(input.mime);
  const key = `links/${input.userId}/${Date.now()}-${uid("img")}.${ext}`;
  const res = await uploadToR2({
    key,
    buffer: input.buffer,
    contentType: input.mime || "image/jpeg",
    metadata: {
      userId: input.userId,
      service: "lbpay-product",
    },
  });
  return { url: res.url, publicId: res.key, bytes: res.bytes };
}

export async function uploadAvatarImageR2(input: {
  buffer: Buffer;
  userId: string;
  mime: string;
}) {
  if (input.buffer.byteLength > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }
  const ext = mimeToExtension(input.mime);
  const key = `avatars/${input.userId}/avatar-${Date.now()}-${uid("img")}.${ext}`;
  const res = await uploadToR2({
    key,
    buffer: input.buffer,
    contentType: input.mime || "image/jpeg",
    metadata: {
      userId: input.userId,
      service: "lbpay-avatar",
    },
  });
  return { url: res.url, publicId: res.key, bytes: res.bytes };
}
