import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireActiveUser } from "@/lib/server/guard";
import { catchRoute } from "@/lib/server/api";
import { MAX_KYC_UPLOAD_BYTES } from "@/lib/kyc";
import { cloudinaryConfigured, uploadProductImage } from "@/lib/server/cloudinary";
import { uid } from "@/lib/format";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function safeUserFolder(userId: string) {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "user";
}

async function saveLocalProductImage(userId: string, buffer: Buffer) {
  const folder = safeUserFolder(userId);
  const name = `${uid("img")}.jpg`;
  const rel = `/uploads/links/${folder}/${name}`;
  const file = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
  return { url: rel, publicId: `local:${rel}`, bytes: buffer.byteLength };
}

const DATA_IMAGE_MAX_BYTES = 480_000;

function saveDataProductImage(buffer: Buffer) {
  if (buffer.byteLength > DATA_IMAGE_MAX_BYTES) {
    throw new Error("That photo is still too large. Try a smaller JPG or PNG.");
  }
  const url = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  return { url, publicId: `data:${uid("img")}`, bytes: buffer.byteLength };
}

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    const type = String(file.type || "").toLowerCase();
    if (type.includes("heic") || type.includes("heif")) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WEBP photo." }, { status: 400 });
    }
    if (!ALLOWED.has(type) && !type.startsWith("image/")) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP photo." }, { status: 400 });
    }
    if (file.size > MAX_KYC_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Maximum upload is 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const stored = cloudinaryConfigured()
        ? await uploadProductImage({
            buffer,
            userId: auth.user.id,
            mime: file.type,
          })
        : await saveLocalProductImage(auth.user.id, buffer);
      return NextResponse.json({
        ok: true,
        url: stored.url,
        publicId: stored.publicId,
        bytes: stored.bytes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/cloudinary|photo|upload|EROFS|read-only|ENOENT|EACCES/i.test(message)) {
        try {
          const stored = await saveDataProductImage(buffer);
          return NextResponse.json({
            ok: true,
            url: stored.url,
            publicId: stored.publicId,
            bytes: stored.bytes,
          });
        } catch (fallbackError) {
          const fallback = fallbackError instanceof Error ? fallbackError.message : "";
          return NextResponse.json(
            { error: fallback || "Could not store that photo. Try a smaller JPG or PNG." },
            { status: 500 },
          );
        }
      }
      throw error;
    }
  } catch (error) {
    return catchRoute("product-upload", error);
  }
}
