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
