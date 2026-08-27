import { NextResponse } from "next/server";
import { listKeys, listLogs, listWebhooks, revokeApiKey } from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { issueLiveKey, issueSandboxKey } from "@/lib/server/apikey";

export async function GET() {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({
    keys: await listKeys(auth.user.id),
    logs: await listLogs(auth.user.id),
    webhooks: await listWebhooks(auth.user.id),
    liveReady: auth.user.kyc.developer === "verified",
    kyc: auth.user.kyc.developer,
  });
}

export async function POST(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const env = body.env === "live" ? "live" : "sandbox";
  if (env === "live" && auth.user.kyc.developer !== "verified") {
    return NextResponse.json(
      { error: "Live keys are issued after developer KYC is approved." },
      { status: 403 },
    );
  }
  const issued = env === "live" ? await issueLiveKey(auth.user) : await issueSandboxKey(auth.user);
  return NextResponse.json({
    ok: true,
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
