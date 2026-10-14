import { mediaSrc } from "@/lib/media";
import { NextResponse } from "next/server";
import { findLinkBySlug, findUserByHandle } from "@/lib/server/db";
import { isSafeProductImageUrl } from "@/lib/product-image";
import { resolveAvatar } from "@/lib/avatar";

const DATA_URL = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/]+=*)$/i;

/**
 * GET /api/share-image/product/:slug  or  /api/share-image/avatar/:handle
 * Serves the image link-preview crawlers need as a real file.
 */
export async function GET(_request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await context.params;
  let raw = "";
  if (kind === "product") {
    const link = await findLinkBySlug(decodeURIComponent(id));
    if (link && isSafeProductImageUrl(link.imageUrl || "")) raw = link.imageUrl || "";
  } else if (kind === "avatar") {
    const user = await findUserByHandle(decodeURIComponent(id));
    if (user) raw = resolveAvatar(user.avatar) || "";
  }
  if (!raw) return new NextResponse("Not found", { status: 404 });
  raw = String(mediaSrc(raw));

  const data = raw.match(DATA_URL);
  if (data) {
    const bytes = Uint8Array.from(atob(data[2]), (c) => c.charCodeAt(0));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": data[1].toLowerCase().replace("jpg", "jpeg"),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }
  if (raw.startsWith("https://")) return NextResponse.redirect(raw, 302);
  if (raw.startsWith("/")) return NextResponse.redirect(new URL(raw, _request.url), 302);
  return new NextResponse("Not found", { status: 404 });
}
