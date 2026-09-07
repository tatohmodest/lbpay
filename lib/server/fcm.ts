export type FcmPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type FcmResult = "sent" | "gone" | "skipped" | "failed";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type CachedToken = { accessToken: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

export function parseFirebaseServiceAccount(raw: string | undefined | null): ServiceAccount | null {
  const text = (raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const projectId = String(parsed.project_id || "").trim();
    const email = String(parsed.client_email || "").trim();
    const key = String(parsed.private_key || "")
      .replace(/\\n/g, "\n")
      .trim();
    if (!projectId || !email || !key.includes("BEGIN PRIVATE KEY")) return null;
    return { project_id: projectId, client_email: email, private_key: key };
  } catch {
    return null;
  }
}

export function firebaseServiceAccountFromEnv() {
  return parseFirebaseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export function fcmHttpV1Body(token: string, payload: FcmPayload) {
  return {
    message: {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url || "/wallet",
      },
      android: {
        priority: "HIGH" as const,
        notification: {
          channelId: "lbpay_money",
          sound: "lbpay_alert",
          tag: payload.tag || "lbpay",
        },
      },
    },
  };
}

export async function sendFcm(token: string, payload: FcmPayload): Promise<FcmResult> {
  const account = firebaseServiceAccountFromEnv();
  if (account) return sendFcmHttpV1(account, token, payload);

  const legacyKey = process.env.FIREBASE_FCM_SERVER_KEY || process.env.FCM_SERVER_KEY || "";
  if (legacyKey) return sendFcmLegacy(legacyKey, token, payload);

  return "skipped";
}

async function sendFcmHttpV1(account: ServiceAccount, token: string, payload: FcmPayload): Promise<FcmResult> {
  const accessToken = await googleAccessToken(account);
  if (!accessToken) return "failed";

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fcmHttpV1Body(token, payload)),
  });

  if (res.ok) return "sent";
  const body = await res.text().catch(() => "");
  if (res.status === 404 || /UNREGISTERED|NOT_FOUND/i.test(body)) return "gone";
  console.error("[lbpay] fcm v1 delivery failed", res.status);
  return "failed";
}

async function sendFcmLegacy(key: string, token: string, payload: FcmPayload): Promise<FcmResult> {
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      priority: "high",
      notification: {
        title: payload.title,
        body: payload.body,
        sound: "lbpay_alert",
        android_channel_id: "lbpay_money",
        tag: payload.tag || "lbpay",
      },
      data: { url: payload.url || "/wallet" },
      android: {
        priority: "high",
        notification: {
          sound: "lbpay_alert",
          channel_id: "lbpay_money",
        },
      },
    }),
  });
  if (res.ok) return "sent";
  if (res.status === 404 || res.status === 410) return "gone";
  console.error("[lbpay] fcm delivery failed", res.status);
  return "failed";
}

async function googleAccessToken(account: ServiceAccount) {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.accessToken;

  const assertion = await signServiceAccountJwt(account);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.error("[lbpay] firebase token request failed", res.status);
    return "";
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  const accessToken = String(json.access_token || "");
  const expiresIn = Number(json.expires_in || 3600);
  if (!accessToken) return "";
  cachedToken = { accessToken, expiresAt: now + expiresIn * 1000 };
  return accessToken;
}

async function signServiceAccountJwt(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const claims = base64UrlJson({
    iss: account.client_email,
    sub: account.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  });
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

function pemToPkcs8(pem: string) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = Buffer.from(b64, "base64");
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

function base64UrlJson(value: unknown) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
