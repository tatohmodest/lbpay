import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { clearSession } from "@/lib/server/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("logout", error);
  }
}
