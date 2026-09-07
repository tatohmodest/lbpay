import { MAX_KYC_UPLOAD_BYTES } from "@/lib/kyc";

export const MAX_IMAGE_UPLOAD_BYTES = MAX_KYC_UPLOAD_BYTES;
const KYC_TARGET_BYTES = 900_000;
const KYC_MAX_EDGE = 1600;
const PRODUCT_TARGET_BYTES = 380_000;
const PRODUCT_MAX_EDGE = 1280;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not compress that photo."));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function loadBitmap(file: File) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that photo."));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(
  file: File,
  options: { targetBytes: number; maxEdge: number; filename: string; emptyError: string },
) {
  if (!file.type.startsWith("image/")) {
    throw new Error(options.emptyError);
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }

  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, options.maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that photo.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    let quality = 0.74;
    let blob = await canvasToBlob(canvas, quality);
    while (blob.size > options.targetBytes && quality > 0.38) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, quality);
    }
    if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error("That photo is still too large after compression. Try a smaller image.");
    }
    return new File([blob], options.filename, { type: "image/jpeg" });
  } catch (error) {
    const readable = /image\/(jpeg|jpg|png|webp)/i.test(file.type);
    if (readable && file.size <= MAX_IMAGE_UPLOAD_BYTES) return file;
    throw error instanceof Error && /compress|read|process/i.test(error.message)
      ? error
      : new Error("Use a JPG, PNG, or WEBP photo.");
  }
}

export async function compressKycImage(file: File) {
  return compressImage(file, {
    targetBytes: KYC_TARGET_BYTES,
    maxEdge: KYC_MAX_EDGE,
    filename: "kyc.jpg",
    emptyError: "Upload a photo of your document.",
  });
}

export async function compressProductImage(file: File) {
  return compressImage(file, {
    targetBytes: PRODUCT_TARGET_BYTES,
    maxEdge: PRODUCT_MAX_EDGE,
    filename: "product.jpg",
    emptyError: "Upload a photo of the product.",
  });
}

export async function compressAvatarImage(file: File) {
  return compressImage(file, {
    targetBytes: 280_000,
    maxEdge: 800,
    filename: "avatar.jpg",
    emptyError: "Choose a profile photo.",
  });
}
