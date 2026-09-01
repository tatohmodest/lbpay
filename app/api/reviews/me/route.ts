import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { findReviewByUser } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    const review = await findReviewByUser(auth.user.id);
    return NextResponse.json({ review });
  } catch (error) {
    return catchRoute("reviews-me", error);
  }
}
