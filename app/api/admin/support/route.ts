import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/guard";
import { listSupportThreadsForAdmin, supportUnreadAdminCount } from "@/lib/server/support";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error!;
    const threads = await listSupportThreadsForAdmin();
    const unread = await supportUnreadAdminCount();
    return NextResponse.json({ threads, unread });
  } catch (error) {
    return catchRoute("admin-support-list", error);
  }
}
