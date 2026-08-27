import { payunitGatewayUrl } from "@/lib/site";
import { PayUnitRail } from "./payunit";
import { SandboxRail } from "./sandbox";
import type { PaymentRail } from "./types";

export function getPaymentRail(env: "sandbox" | "live" = "live"): PaymentRail {
  if (env === "sandbox") return new SandboxRail();

  const ready =
    process.env.PAYUNIT_API_KEY &&
    process.env.PAYUNIT_API_USER &&
    process.env.PAYUNIT_API_PASSWORD;

  if (!ready) {
    throw new Error("PayUnit is not configured. Set PAYUNIT_API_KEY, PAYUNIT_API_USER, and PAYUNIT_API_PASSWORD.");
  }

  const mode = process.env.PAYUNIT_MODE;
  if (mode !== "live" && mode !== "test") {
    throw new Error("Set PAYUNIT_MODE to live or test.");
  }

  return new PayUnitRail({
    apiKey: process.env.PAYUNIT_API_KEY!,
    apiUser: process.env.PAYUNIT_API_USER!,
    apiPassword: process.env.PAYUNIT_API_PASSWORD!,
    baseUrl: payunitGatewayUrl(process.env.PAYUNIT_BASE_URL),
    mode,
  });
}
