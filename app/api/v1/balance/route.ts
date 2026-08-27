import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, merchantBalance } from "@/lib/server/apikey";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;
  const available = await merchantBalance(user.id);
  await logApi(user.id, "GET", "/v1/balance", 200);
  return NextResponse.json({
    object: "balance",
    currency: "XAF",
    available,
    pending: 0,
    environment: env,
  });
}
