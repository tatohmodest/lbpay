import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function expectedHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("host") || request.nextUrl.host || "").toLowerCase();
}

/**
 * Protects all cookie-authenticated mutating /api/* routes from cross-site and
 * sibling-subdomain CSRF attacks while leaving Bearer-authenticated /api/v1/*
 * and secret-authenticated /api/cron/* untouched.
 */
export function proxy(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/v1/") || pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site" || fetchSite === "same-site") {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    if (origin === "null") {
      return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
    }
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const targetHost = expectedHost(request);
      if (targetHost && originHost !== targetHost) {
        return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
