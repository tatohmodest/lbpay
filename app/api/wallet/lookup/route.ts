import { NextResponse } from "next/server";
import { findUserByHandle } from "@/lib/server/db";
import { resolveAvatar } from "@/lib/avatar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  const user = await findUserByHandle(q);
  if (!user) return NextResponse.json({ found: false });
  return NextResponse.json({
    found: true,
    user: {
      name: user.name,
      lbpayId: user.lbpayId,
      avatar: resolveAvatar(user.avatar),
    },
  });
}
