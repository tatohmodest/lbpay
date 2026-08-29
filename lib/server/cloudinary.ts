import { v2 as cloudinary } from "cloudinary";
import { MAX_KYC_UPLOAD_BYTES, type KycImageKind } from "@/lib/kyc";

function cloudName() {
  return String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
}

export function cloudinaryConfigured() {
  return Boolean(cloudName() && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function client() {
  if (!cloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({
    cloud_name: cloudName(),
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

function inferCloudName(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return "";
    return decodeURIComponent(parsed.pathname).split("/").filter(Boolean)[0] || "";
  } catch {
    return "";
  }
}

export function isOurCloudinaryUrl(url: string) {
  const name = cloudName();
  if (!name || !url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && parsed.pathname.startsWith(`/${name}/`);
  } catch {
    return false;
  }
}

function isTransformSegment(part: string) {
  if (!part) return true;
  if (part.startsWith("s--") && part.endsWith("--")) return true;
  if (/^v\d+$/.test(part)) return true;
  return /[,=]/.test(part) || /^(c_|w_|h_|q_|f_|e_|g_|x_|y_|r_|b_|l_|o_|dpr_|ar_)/.test(part);
}

/** Public id from a Cloudinary URL, including transformed delivery URLs. */
export function cloudinaryPublicId(urlOrPublicId: string | null | undefined): string | null {
  const raw = String(urlOrPublicId || "").trim();
  if (!raw) return null;
  if (!raw.includes("://") && !raw.includes("/upload/")) {
    const id = raw.replace(/\.[^./]+$/, "");
    return id && !id.includes("://") ? id : null;
  }

  let path = raw;
  try {
    if (raw.includes("://")) path = decodeURIComponent(new URL(raw).pathname);
  } catch {
    return null;
  }

  const marker = "/upload/";
  const idx = path.indexOf(marker);
  if (idx === -1) return null;
  const rest = path.slice(idx + marker.length);
  const versioned = rest.match(/^(?:.*\/)?v\d+\/(.+)$/);
  let withExt = versioned?.[1] || "";
  if (!withExt) {
    const parts = rest.split("/").filter(Boolean);
    const start = parts.findIndex((part) => !isTransformSegment(part));
    if (start === -1) return null;
    withExt = parts.slice(start).join("/");
  }
  const publicId = withExt.replace(/\.[^./]+$/, "");
  return publicId && !publicId.includes("://") ? publicId : null;
}

function deleteClient(urlOrPublicId?: string) {
  const name = cloudName() || (urlOrPublicId && urlOrPublicId.includes("://") ? inferCloudName(urlOrPublicId) : "");
  if (!name || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }
  cloudinary.config({
    cloud_name: name,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function uploadKycImage(input: {
  buffer: Buffer;
  userId: string;
  kind: KycImageKind;
  mime: string;
}) {
  if (input.buffer.byteLength > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }
  const folder = `${process.env.CLOUDINARY_FOLDER || "lbpay/kyc"}/${input.userId}`;
  const uploaded = await new Promise<{
    secure_url: string;
    public_id: string;
    bytes: number;
    eager?: Array<{ secure_url?: string; bytes?: number }>;
  }>((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        unique_filename: true,
        overwrite: false,
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto:good", fetch_format: "jpg" },
        ],
        eager: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good", fetch_format: "jpg" }],
        eager_async: false,
        context: `kind=${input.kind}|user=${input.userId}`,
        tags: ["lbpay-kyc", input.kind],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error instanceof Error ? error : new Error("Cloudinary could not store that photo."));
          return;
        }
        resolve(result as { secure_url: string; public_id: string; bytes: number; eager?: Array<{ secure_url?: string; bytes?: number }> });
      },
    );
    stream.end(input.buffer);
  });

  const compressed = uploaded.eager?.[0];
  return {
    url: compressed?.secure_url || uploaded.secure_url,
    publicId: uploaded.public_id,
    bytes: compressed?.bytes || uploaded.bytes,
  };
}

export async function uploadProductImage(input: {
  buffer: Buffer;
  userId: string;
  mime: string;
}) {
  if (input.buffer.byteLength > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }
  const folder = `lbpay/links/${input.userId}`;
  const uploaded = await new Promise<{
    secure_url: string;
    public_id: string;
    bytes: number;
    eager?: Array<{ secure_url?: string; bytes?: number }>;
  }>((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        unique_filename: true,
        overwrite: false,
        transformation: [
          { width: 1280, height: 1280, crop: "limit" },
          { quality: "auto:eco", fetch_format: "jpg" },
        ],
        eager: [{ width: 1280, height: 1280, crop: "limit", quality: "auto:eco", fetch_format: "jpg" }],
        eager_async: false,
        tags: ["lbpay-product", input.userId],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error instanceof Error ? error : new Error("Cloudinary could not store that photo."));
          return;
        }
        resolve(result as { secure_url: string; public_id: string; bytes: number; eager?: Array<{ secure_url?: string; bytes?: number }> });
      },
    );
    stream.end(input.buffer);
  });

  const compressed = uploaded.eager?.[0];
  return {
    url: compressed?.secure_url || uploaded.secure_url,
    publicId: uploaded.public_id,
    bytes: compressed?.bytes || uploaded.bytes,
  };
}

export async function deleteCloudinaryImage(urlOrPublicId: string | null | undefined, timeoutMs = 8000) {
  if (!urlOrPublicId) return false;
  const api = deleteClient(urlOrPublicId);
  if (!api) return false;

  const publicId = cloudinaryPublicId(urlOrPublicId);
  if (!publicId) return false;

  try {
    const result = await withTimeout(
      api.uploader.destroy(publicId, { resource_type: "image", invalidate: true }),
      timeoutMs,
    );
    return result?.result === "ok" || result?.result === "not_found";
  } catch {
    return false;
  }
}
