import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { listPublicReviews, upsertReview } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";

export async function GET() {
  try {
    const reviews = await listPublicReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    return catchRoute("reviews-list", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = await request.json().catch(() => ({}));
    const review = await upsertReview(auth.user.id, {
      rating: Number(body.rating),
      body: String(body.body || ""),
    });
    return NextResponse.json({ ok: true, review });
  } catch (error) {
    if (error instanceof Error && /star rating|a little more|320 characters/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return catchRoute("reviews-save", error);
  }
}
