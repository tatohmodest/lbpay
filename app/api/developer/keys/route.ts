import { NextResponse } from "next/server";
import { listKeys, listLogs, listWebhooks, revokeApiKey } from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { issueKeyForEnv } from "@/lib/server/apikey";
import { isAdmin } from "@/lib/roles";

export async function GET() {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const liveReady = auth.user.kyc.developer === "verified" || isAdmin(auth.user);
  return NextResponse.json({
    keys: await listKeys(auth.user.id),
    logs: await listLogs(auth.user.id),
    webhooks: await listWebhooks(auth.user.id),
    liveReady,
    kyc: auth.user.kyc.developer,
  });
}

export async function POST(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const env = body.env === "live" ? "live" : "sandbox";
  const issued = await issueKeyForEnv(auth.user, env);
  return NextResponse.json({
    ok: true,
    id: issued.id,
    env,
    publicKey: issued.publicKey,
    secret: issued.secret,
    secretMasked: issued.secretMasked,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  await revokeApiKey(String(body.id || ""), auth.user.id);
  return NextResponse.json({ ok: true });
}
