import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult } from "./types";

type PayUnitConfig = {
  apiKey: string;
  apiUser: string;
  apiPassword: string;
  baseUrl: string;
  mode: "test" | "live";
};

/**
 * PayUnit REST rail — collections and disbursements.
 * Docs: https://developer.payunit.net
 * Host: https://gateway.payunit.net
 */
export class PayUnitRail implements PaymentRail {
  constructor(private readonly config: PayUnitConfig) {}

  private headers() {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      mode: this.config.mode,
      Authorization: `Basic ${Buffer.from(`${this.config.apiUser}:${this.config.apiPassword}`).toString("base64")}`,
    };
  }

  private gateway(method: RailCollectInput["method"]) {
    if (method === "orange") return "CM_ORANGE";
    if (method === "mtn") return "CM_MTNMOMO";
    return undefined;
  }

  async collect(input: RailCollectInput): Promise<RailResult> {
    const init = await fetch(`${this.config.baseUrl}/api/gateway/initialize`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        total_amount: input.amount,
        currency: input.currency,
        transaction_id: input.reference,
        return_url: process.env.LBPAY_RETURN_URL,
        notify_url: process.env.LBPAY_WEBHOOK_URL,
        payment_country: "CM",
        pay_with: this.gateway(input.method),
      }),
    });
    const initRaw = await init.json().catch(() => ({}));
    if (!init.ok) {
      return { provider: "payunit", reference: input.reference, status: "failed", raw: initRaw };
    }

    if (input.method === "card" || !input.customer.phone) {
      return {
        provider: "payunit",
        reference: input.reference,
        providerRef: initRaw?.data?.transaction_id,
        status: "pending",
        hostedUrl: initRaw?.data?.transaction_url,
        raw: initRaw,
      };
    }

    const pay = await fetch(`${this.config.baseUrl}/api/gateway/makepayment`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        gateway: this.gateway(input.method),
        amount: input.amount,
        transaction_id: input.reference,
        return_url: process.env.LBPAY_RETURN_URL,
        notify_url: process.env.LBPAY_WEBHOOK_URL,
        phone_number: input.customer.phone,
        currency: input.currency,
        paymentType: "button",
      }),
    });
    const payRaw = await pay.json().catch(() => ({}));
    const paymentStatus = String(payRaw?.data?.payment_status || "").toUpperCase();
    return {
      provider: "payunit",
      reference: input.reference,
      providerRef: payRaw?.data?.provider_transaction_id || payRaw?.data?.transaction_id,
      status: paymentStatus === "SUCCESS" ? "success" : pay.ok ? "pending" : "failed",
      raw: { initialize: initRaw, makePayment: payRaw },
    };
  }

  async disburse(input: RailDisburseInput): Promise<RailResult> {
    const created = await fetch(`${this.config.baseUrl}/api/disbursement`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        destination_currency: input.currency,
        debit_currency: input.currency,
        account_number: input.phone.startsWith("237") ? input.phone : `237${input.phone}`,
        amount: input.amount,
        beneficiary_name: input.beneficiaryName || "LBPay user",
        deposit_type: "MOBILE_MONEY",
        transaction_id: input.reference,
        country: "CM",
        account_bank: input.network === "orange" ? "CM_ORANGE" : "CM_MTNMOMO",
      }),
    });
    const createdRaw = await created.json().catch(() => ({}));
    if (!created.ok) {
      return { provider: "payunit", reference: input.reference, status: "failed", raw: createdRaw };
    }

    const token = createdRaw?.data?.pay_token || createdRaw?.pay_token;
    const confirmed = await fetch(`${this.config.baseUrl}/api/disbursement/confirm`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        pay_token: token,
        deposit_message: input.note || "LBPay disbursement",
        deposit_note: input.note || "Wallet withdrawal",
        notify_url: process.env.LBPAY_WEBHOOK_URL,
      }),
    });
    const confirmedRaw = await confirmed.json().catch(() => ({}));
    return {
      provider: "payunit",
      reference: input.reference,
      providerRef: token,
      status: confirmed.ok ? "pending" : "failed",
      raw: { create: createdRaw, confirm: confirmedRaw },
    };
  }
}
