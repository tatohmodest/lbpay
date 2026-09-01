import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/server/guard";
import { catchRoute } from "@/lib/server/api";
import { MAX_KYC_UPLOAD_BYTES } from "@/lib/kyc";
import {
  cloudinaryConfigured,
  deleteCloudinaryImage,
  isOurCloudinaryUrl,
  uploadAvatarImage,
} from "@/lib/server/cloudinary";
import { publicUser, upsertUser } from "@/lib/server/db";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    if (!cloudinaryConfigured()) {
      return NextResponse.json({ error: "Photo upload is not available yet." }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    if (!ALLOWED.has(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP photo." }, { status: 400 });
    }
    if (file.size > MAX_KYC_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Maximum upload is 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadAvatarImage({
      buffer,
      userId: auth.user.id,
      mime: file.type,
    });
    const previous = auth.user.avatar;
    auth.user.avatar = stored.url;
    await upsertUser(auth.user);
    if (previous && isOurCloudinaryUrl(previous) && previous !== stored.url) {
      void deleteCloudinaryImage(previous);
    }
    return NextResponse.json({
      ok: true,
      url: stored.url,
      user: publicUser(auth.user),
    });
  } catch (error) {
    return catchRoute("avatar-upload", error);
  }
}
