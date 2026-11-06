import { NextResponse } from "next/server";
import { mediaKey } from "@/lib/media";
import { readFromR2 } from "@/lib/server/r2";
import { currentUser, requireAdmin } from "@/lib/server/guard";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = mediaKey(`/api/media/${parts.join("/")}`);
  if (!key) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isKyc = key.startsWith("kyc/");
  if (isKyc) {
    // Identity photos: only the person who uploaded them, or staff with KYC permission.
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    if (user.id !== key.split("/")[1]) {
      const admin = await requireAdmin("kyc");
      if (admin.error) return admin.error;
    }
  }

  const file = await readFromR2(key).catch((error) => {
    console.error("[lbpay] media read failed", key, error);
    return null;
  });
  if (!file?.body) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Only raster images are served inline. Anything else (an SVG with a script in it)
  // is downloaded instead and can never run on the LBPay domain.
  const stored = (file.headers.get("content-type") || "image/jpeg").toLowerCase();
  const safe = /^image\/(jpeg|jpg|png|webp|gif|avif|heic|heif)\b/.test(stored);
  return new Response(file.body, {
    headers: {
      "content-type": safe ? stored : "application/octet-stream",
      ...(safe ? {} : { "content-disposition": "attachment" }),
      "content-security-policy": "default-src 'none'; sandbox",
      "cache-control": isKyc ? "private, no-store" : "public, max-age=86400, s-maxage=604800, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
