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

  return new Response(file.body, {
    headers: {
      "content-type": file.headers.get("content-type") || "image/jpeg",
      "cache-control": isKyc ? "private, no-store" : "public, max-age=86400, s-maxage=604800, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
