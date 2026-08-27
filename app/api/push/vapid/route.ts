import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { getVapidPublicKey } from "@/lib/server/push";

export async function GET() {
  try {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      return NextResponse.json({ configured: false, publicKey: "" });
    }
    return NextResponse.json({ configured: true, publicKey });
  } catch (error) {
    return catchRoute("push-vapid", error);
  }
}
