import { MAX_KYC_UPLOAD_BYTES } from "@/lib/kyc";

const TARGET_BYTES = 900_000;
const MAX_EDGE = 1600;

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

export async function compressKycImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Upload a photo of your document.");
  }
  if (file.size > MAX_KYC_UPLOAD_BYTES) {
    throw new Error("Maximum upload is 10MB.");
  }

  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that photo.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    let quality = 0.76;
    let blob = await canvasToBlob(canvas, quality);
    while (blob.size > TARGET_BYTES && quality > 0.42) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, quality);
    }
    if (blob.size > MAX_KYC_UPLOAD_BYTES) {
      throw new Error("That photo is still too large after compression. Try a smaller image.");
    }
    return new File([blob], "kyc.jpg", { type: "image/jpeg" });
  } catch (error) {
    if (file.size <= MAX_KYC_UPLOAD_BYTES && file.type.startsWith("image/")) return file;
    throw error instanceof Error ? error : new Error("Could not compress that photo.");
  }
}
