import { httpsCallbackUrl } from "@/lib/site";
import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult } from "./types";

type PayUnitConfig = {
  apiKey: string;
  apiUser: string;
  apiPassword: string;
  baseUrl: string;
  mode: "test" | "live";
};

type PayUnitBody = {
  status?: string;
  statusCode?: number | string;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
  pay_token?: string;
};

/**
 * PayUnit REST rail: collections and disbursements.
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

  private returnUrl() {
    return httpsCallbackUrl(process.env.LBPAY_RETURN_URL, "/wallet");
  }

  private notifyUrl() {
    return httpsCallbackUrl(process.env.LBPAY_WEBHOOK_URL, "/api/v1/webhooks/payunit");
  }

  private gateway(method: RailCollectInput["method"] | RailDisburseInput["network"]) {
    if (method === "orange") return "CM_ORANGE";
    if (method === "mtn") return "CM_MTNMOMO";
    return undefined;
  }

  private collectionPhone(phone?: string) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.startsWith("237") && digits.length >= 12) return digits.slice(3);
    if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
    return digits;
  }

  private disbursementAccount(phone: string) {
    const local = this.collectionPhone(phone);
    return local.startsWith("237") ? local : `237${local}`;
  }

  private message(raw: PayUnitBody | undefined, fallback: string) {
    const value = String(raw?.message || raw?.error || raw?.data?.message || "").trim();
    return value || fallback;
  }

  private accepted(httpOk: boolean, raw: PayUnitBody | undefined) {
    const status = String(raw?.status || "").toUpperCase();
    if (status === "FAILED" || status === "ERROR") return false;
    if (status === "SUCCESS") return true;
    return httpOk;
  }

  private async post(path: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      const raw = (await res.json().catch(() => ({}))) as PayUnitBody;
      return { ok: this.accepted(res.ok, raw), status: res.status, raw };
    } catch (error) {
      const message = error instanceof Error ? error.message : "PayUnit request failed.";
      return { ok: false, status: 0, raw: { message } satisfies PayUnitBody };
    }
  }

  async collect(input: RailCollectInput): Promise<RailResult> {
    const returnUrl = this.returnUrl();
    const notifyUrl = this.notifyUrl();
    const phone = this.collectionPhone(input.customer.phone);
    const gateway = this.gateway(input.method);

    const init = await this.post("/api/gateway/initialize", {
      total_amount: input.amount,
      currency: input.currency,
      transaction_id: input.reference,
      return_url: returnUrl,
      notify_url: notifyUrl,
      payment_country: "CM",
      ...(gateway ? { pay_with: gateway } : {}),
    });

    if (!init.ok) {
      const message = this.message(init.raw, "PayUnit could not start the collection.");
      console.error("[lbpay] payunit initialize failed", init.status, message);
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message,
        raw: init.raw,
      };
    }

    const hostedUrl = typeof init.raw.data?.transaction_url === "string" ? init.raw.data.transaction_url : undefined;

    if (input.method === "card" || !/^6\d{8}$/.test(phone)) {
      return {
        provider: "payunit",
        reference: input.reference,
        providerRef: String(init.raw.data?.transaction_id || input.reference),
        status: "pending",
        hostedUrl,
        raw: init.raw,
      };
    }

    const pay = await this.post("/api/gateway/makepayment", {
      gateway,
      amount: input.amount,
      transaction_id: input.reference,
      return_url: returnUrl,
      notify_url: notifyUrl,
      phone_number: phone,
      currency: input.currency,
      paymentType: "button",
    });

    const paymentStatus = String(pay.raw.data?.payment_status || "").toUpperCase();
    if (!pay.ok) {
      const message = this.message(pay.raw, "PayUnit could not reach the Mobile Money number.");
      console.error("[lbpay] payunit makepayment failed", pay.status, message);
      if (hostedUrl) {
        return {
          provider: "payunit",
          reference: input.reference,
          providerRef: String(init.raw.data?.transaction_id || input.reference),
          status: "pending",
          message,
          hostedUrl,
          raw: { initialize: init.raw, makePayment: pay.raw },
        };
      }
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message,
        raw: { initialize: init.raw, makePayment: pay.raw },
      };
    }

    return {
      provider: "payunit",
      reference: input.reference,
      providerRef: String(pay.raw.data?.provider_transaction_id || pay.raw.data?.transaction_id || input.reference),
      status: paymentStatus === "SUCCESS" ? "success" : "pending",
      hostedUrl,
      raw: { initialize: init.raw, makePayment: pay.raw },
    };
  }

  async disburse(input: RailDisburseInput): Promise<RailResult> {
    const created = await this.post("/api/disbursement", {
      destination_currency: input.currency,
      debit_currency: input.currency,
      account_number: this.disbursementAccount(input.phone),
      amount: input.amount,
      beneficiary_name: input.beneficiaryName || "LBPay user",
      deposit_type: "MOBILE_MONEY",
      transaction_id: input.reference,
      country: "CM",
      account_bank: this.gateway(input.network),
    });
    if (!created.ok) {
      const message = this.message(created.raw, "PayUnit could not start the disbursement.");
      console.error("[lbpay] payunit disbursement create failed", created.status, message);
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message,
        raw: created.raw,
      };
    }

    const token = String(created.raw.data?.pay_token || created.raw.pay_token || "");
    const confirmed = await this.post("/api/disbursement/confirm", {
      pay_token: token,
      deposit_message: input.note || "LBPay disbursement",
      deposit_note: input.note || "Wallet withdrawal",
      notify_url: this.notifyUrl(),
    });
    if (!confirmed.ok) {
      const message = this.message(confirmed.raw, "PayUnit could not confirm the disbursement.");
      console.error("[lbpay] payunit disbursement confirm failed", confirmed.status, message);
      return {
        provider: "payunit",
        reference: input.reference,
        providerRef: token,
        status: "failed",
        message,
        raw: { create: created.raw, confirm: confirmed.raw },
      };
    }
    return {
      provider: "payunit",
      reference: input.reference,
      providerRef: token,
      status: "pending",
      raw: { create: created.raw, confirm: confirmed.raw },
    };
  }
}
