import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/guard";
import { isAdmin } from "@/lib/roles";
import { readAdminSession } from "@/lib/server/session";

export async function GET() {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error!;
  if (!isAdmin(auth.user)) {
    return NextResponse.json({ admin: false, error: "Admin only." }, { status: 403 });
  }
  const step = await readAdminSession();
  if (!step || step.userId !== auth.user.id) {
    return NextResponse.json({ admin: true, needOtp: true });
  }
  return NextResponse.json({ admin: true, needOtp: false });
}
