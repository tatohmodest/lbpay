import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  if (!r2Configured()) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: r2Endpoint(),
    credentials: {
      accessKeyId: String(process.env.R2_ACCESS_KEY_ID).trim(),
      secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY).trim(),
    },
  });
  return cachedClient;
}

/**
 * Checks whether an image URL belongs to our Cloudflare R2 bucket.
 */
export function isOurR2Url(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;

    // Check against configured public base URL
    const publicBase = r2PublicUrl();
    if (publicBase) {
      try {
        const baseParsed = new URL(publicBase);
        if (parsed.hostname === baseParsed.hostname) return true;
      } catch {
        // ignore parse error
      }
    }

    // Generic Cloudflare R2 domains
    return (
      parsed.hostname.endsWith(".r2.dev") ||
      parsed.hostname.endsWith(".r2.cloudflarestorage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Extracts the storage key from an R2 URL or raw key.
 */
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

export async function uploadToR2(input: {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string; key: string; bytes: number }> {
  const client = getR2Client();
  const cleanKey = input.key.replace(/^\/+/, "");
  const bytes = input.buffer.byteLength;

  await client.send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: cleanKey,
      Body: input.buffer,
      ContentType: input.contentType,
      Metadata: input.metadata,
    }),
  );

  const publicUrl = `${r2PublicUrl()}/${cleanKey}`;
  return {
    url: publicUrl,
    key: cleanKey,
    bytes,
  };
}

export async function deleteFromR2(urlOrKey: string | null | undefined): Promise<boolean> {
  const key = r2Key(urlOrKey);
  if (!key) return false;
  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: r2Bucket(),
        Key: key,
      }),
    );
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

  return {
    url: res.url,
    publicId: res.key,
    bytes: res.bytes,
  };
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

  return {
    url: res.url,
    publicId: res.key,
    bytes: res.bytes,
  };
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

  return {
    url: res.url,
    publicId: res.key,
    bytes: res.bytes,
  };
}
