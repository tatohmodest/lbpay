import { PayUnitRail } from "./payunit";
import { SandboxRail } from "./sandbox";
import type { PaymentRail } from "./types";

export function getPaymentRail(): PaymentRail {
  const ready =
    process.env.PAYUNIT_API_KEY &&
    process.env.PAYUNIT_API_USER &&
    process.env.PAYUNIT_API_PASSWORD;

  if (!ready) return new SandboxRail();

  return new PayUnitRail({
    apiKey: process.env.PAYUNIT_API_KEY!,
    apiUser: process.env.PAYUNIT_API_USER!,
    apiPassword: process.env.PAYUNIT_API_PASSWORD!,
    baseUrl: process.env.PAYUNIT_BASE_URL || "https://gateway.payunit.net",
    mode: process.env.PAYUNIT_MODE === "live" ? "live" : "test",
  });
}
