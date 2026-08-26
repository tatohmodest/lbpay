import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult } from "./types";

/**
 * PayUnit is a rail, not the product. LBPay owns customers, wallets,
 * ledgers, checkout, and developer APIs. This adapter is the only
 * place PayUnit credentials and payloads should live.
 */
export class PayUnitRail implements PaymentRail {
  constructor(
    private readonly config: {
      apiKey: string;
      apiUser: string;
      apiPassword: string;
      baseUrl: string;
    },
  ) {}

  async collect(input: RailCollectInput): Promise<RailResult> {
    const response = await fetch(`${this.config.baseUrl}/api/gateway/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        Authorization: `Basic ${Buffer.from(`${this.config.apiUser}:${this.config.apiPassword}`).toString("base64")}`,
      },
      body: JSON.stringify({
        total_amount: input.amount,
        currency: input.currency,
        transaction_id: input.reference,
        return_url: process.env.LBPAY_RETURN_URL,
        notify_url: process.env.LBPAY_WEBHOOK_URL,
        payment_country: "CM",
      }),
    });

    const raw = await response.json().catch(() => ({}));
    return {
      provider: "payunit",
      reference: input.reference,
      providerRef: raw?.data?.transaction_id,
      status: response.ok ? "pending" : "failed",
      raw,
    };
  }

  async disburse(input: RailDisburseInput): Promise<RailResult> {
    const response = await fetch(`${this.config.baseUrl}/api/disburse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        Authorization: `Basic ${Buffer.from(`${this.config.apiUser}:${this.config.apiPassword}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        account_number: input.phone,
        transaction_id: input.reference,
        gateway: input.network === "mtn" ? "mtnmomo" : "orange",
      }),
    });
    const raw = await response.json().catch(() => ({}));
    return {
      provider: "payunit",
      reference: input.reference,
      status: response.ok ? "pending" : "failed",
      raw,
    };
  }
}
