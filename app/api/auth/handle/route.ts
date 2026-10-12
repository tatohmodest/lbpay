import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { isHandleTaken, nextAvailableHandle } from "@/lib/server/db";
import { readSession } from "@/lib/server/session";
import { HANDLE_MIN, cleanHandleInput, isReservedHandle, shortHandleOptions } from "@/lib/handle";

/**
 * GET /api/auth/handle?q=tatoh&name=Tatoh%20Modest%20Wilton
 * Says whether an LBPay ID is free and offers short alternatives.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = cleanHandleInput(String(searchParams.get("q") || ""));
    const name = String(searchParams.get("name") || "").slice(0, 80);
    const session = await readSession();
    const self = session?.userId;

    const free = async (id: string) =>
      id.length >= HANDLE_MIN && !isReservedHandle(id) && !(await isHandleTaken(id, self));

    const ideas: string[] = [];
    for (const id of shortHandleOptions(name, 6)) {
      if (ideas.length >= 3) break;
      if (id !== q && (await free(id))) ideas.push(id);
    }

    if (!q) return NextResponse.json({ handle: "", available: false, ideas });

    if (q.length < HANDLE_MIN) {
      return NextResponse.json({ handle: q, available: false, reason: "short", ideas });
    }
    if (await free(q)) {
      return NextResponse.json({ handle: q, available: true, ideas });
    }
    const suggestion = await nextAvailableHandle(q, self);
    return NextResponse.json({ handle: q, available: false, reason: "taken", suggestion, ideas });
  } catch (error) {
    return catchRoute("handle-check", error);
  }
}
