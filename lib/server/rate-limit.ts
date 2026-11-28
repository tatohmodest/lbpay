import { NextResponse } from "next/server";

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number, maxWindowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const active = bucket.hits.filter((t) => now - t < maxWindowMs);
    if (!active.length) buckets.delete(key);
    else bucket.hits = active;
  }
}

export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return xff;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  sweep(now, Math.max(windowMs, 15 * 60_000));
  const bucket = buckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.max(0, limit - bucket.hits.length) };
}

export function rateLimitByIp(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = clientIp(request);
  const res = checkRateLimit(`${scope}:${ip}`, limit, windowMs);
  if (res.ok) return null;
  return NextResponse.json(
    {
      error: "Too many requests from this network. Please wait a moment and try again.",
      retryAfter: res.retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(res.retryAfterSec) },
    },
  );
}
