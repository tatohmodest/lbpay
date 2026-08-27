import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/server/guard";

export async function POST() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json(
    { error: "This is coming soon. Your wallet was not charged." },
    { status: 503 },
  );
}
