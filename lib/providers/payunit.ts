import { PayunitClient } from "@payunit/nodejs-sdk";
import { httpsCallbackUrl, payunitGatewayUrl } from "@/lib/site";
import { cameroonMsisdn } from "@/lib/phone";
import { publicPaymentError } from "@/lib/public-error";
import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult } from "./types";

type PayUnitMode = "test" | "live";

function collectionPhone(phone?: string) {
  return cameroonMsisdn(phone);
}

function disbursementAccount(phone: string) {
  const local = cameroonMsisdn(phone);
  return local ? `237${local}` : phone.replace(/\D/g, "");
}

function gateway(method: "mtn" | "orange" | "card") {
  if (method === "orange") return "CM_ORANGE" as const;
  if (method === "mtn") return "CM_MTNMOMO" as const;
  return undefined;
}

function railStatus(raw: string | undefined): RailResult["status"] {
  const value = String(raw || "").toUpperCase();
  if (["SUCCESS", "SUCCESSFUL", "SUCCESSFULL", "PAID", "CONFIRMED"].includes(value)) {
    return "success";
  }
  if (["FAILED", "CANCELLED", "CANCELED", "ERROR"].includes(value)) return "failed";
  return "pending";
}

function errorMessage(error: unknown, fallback: string) {
  const raw = error instanceof Error && error.message ? error.message.replace(/^API request failed:\s*/i, "") : fallback;
  console.error("[lbpay] payunit raw error", raw);
  return publicPaymentError(raw);
}

export function createPayunitClient() {
  const mode = process.env.PAYUNIT_MODE;
  if (mode !== "live" && mode !== "test") {
    throw new Error("Set PAYUNIT_MODE to live or test.");
  }
  const apiKey = process.env.PAYUNIT_API_KEY;
  const apiUsername = process.env.PAYUNIT_API_USER;
  const apiPassword = process.env.PAYUNIT_API_PASSWORD;
  if (!apiKey || !apiUsername || !apiPassword) {
    throw new Error("PayUnit is not configured. Set PAYUNIT_API_KEY, PAYUNIT_API_USER, and PAYUNIT_API_PASSWORD.");
  }

  return new PayunitClient({
    baseURL: payunitGatewayUrl(process.env.PAYUNIT_BASE_URL),
    apiKey,
    apiUsername,
    apiPassword,
    mode: mode as PayUnitMode,
    timeout: 30_000,
  });
}

/**
 * Same PayUnit path Mboawin uses: official SDK, HTTPS callbacks,
 * 9-digit MSISDN, then initialize + makepayment with PayUnit's transaction_id.
 */
export class PayUnitRail implements PaymentRail {
  private readonly client = createPayunitClient();

  private returnUrl(override?: string) {
    if (override) {
      try {
        const url = new URL(override);
        if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
      } catch {
        /* fall through */
      }
    }
    return httpsCallbackUrl(process.env.LBPAY_RETURN_URL, "/wallet");
  }

  private notifyUrl() {
    return httpsCallbackUrl(process.env.LBPAY_WEBHOOK_URL, "/api/v1/webhooks/payunit");
  }

  async collect(input: RailCollectInput): Promise<RailResult> {
    const returnUrl = this.returnUrl(input.returnUrl);
    const notifyUrl = this.notifyUrl();
    const phone = collectionPhone(input.customer.phone);
    const provider = gateway(input.method);

    try {
      if (input.method === "card" || !provider || !/^\d{9}$/.test(phone)) {
        const initiated = await this.client.collections.initiatePayment({
          total_amount: input.amount,
          currency: input.currency,
          transaction_id: input.reference,
          return_url: returnUrl,
          notify_url: notifyUrl,
          payment_country: "CM",
          ...(provider ? { pay_with: provider } : {}),
        });
        return {
          provider: "payunit",
          reference: initiated.transaction_id || input.reference,
          providerRef: initiated.transaction_id || input.reference,
          status: "pending",
          hostedUrl: initiated.transaction_url,
          raw: initiated,
        };
      }

      const paid = await this.client.collections.initiateAndMakePaymentMobileMoney({
        total_amount: input.amount,
        currency: input.currency,
        transaction_id: input.reference,
        gateway: provider,
        phone_number: phone,
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_country: "CM",
      });

      return {
        provider: "payunit",
        reference: paid.transaction_id || input.reference,
        providerRef: paid.provider_transaction_id || paid.transaction_id || input.reference,
        status: railStatus(paid.payment_status),
        raw: paid,
      };
    } catch (error) {
      const message = errorMessage(error, "PayUnit could not start the collection.");
      console.error("[lbpay] payunit collect failed", message);
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message,
      };
    }
  }

  async disburse(input: RailDisburseInput): Promise<RailResult> {
    const provider = gateway(input.network);
    if (!provider) {
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message: "Choose MTN or Orange.",
      };
    }

    try {
      const created = await this.client.disbursement.createDisbursement({
        destination_currency: input.currency,
        debit_currency: input.currency,
        account_number: disbursementAccount(input.phone),
        amount: input.amount,
        beneficiary_name: input.beneficiaryName || "LBPay user",
        deposit_type: "MOBILE_MONEY",
        transaction_id: input.reference,
        country: "CM",
        account_bank: provider,
      });
      const confirmed = await this.client.disbursement.confirmDisbursement({
        pay_token: created.pay_token,
        deposit_message: input.note || "LBPay disbursement",
        deposit_note: input.note || "Wallet withdrawal",
        notify_url: this.notifyUrl(),
      });
      return {
        provider: "payunit",
        reference: confirmed.transaction_id || input.reference,
        providerRef: created.pay_token,
        status: railStatus(confirmed.status) === "failed" ? "failed" : "pending",
        raw: { created, confirmed },
      };
    } catch (error) {
      const message = errorMessage(error, "PayUnit could not start the disbursement.");
      console.error("[lbpay] payunit disburse failed", message);
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message,
      };
    }
  }

  async getStatus(reference: string): Promise<RailResult> {
    try {
      const status = await this.client.collections.getTransactionStatus(reference);
      const mapped = railStatus(status.transaction_status);
      return {
        provider: "payunit",
        reference: status.transaction_id || reference,
        providerRef: status.transaction_id || reference,
        status: mapped,
        message:
          mapped === "failed"
            ? publicPaymentError(status.message || "failed")
            : mapped === "pending"
              ? "Your transaction is being processed. This usually takes less than two minutes."
              : undefined,
        raw: status,
      };
    } catch (error) {
      return {
        provider: "payunit",
        reference,
        status: "pending",
        message: errorMessage(error, "Payment is still waiting on the phone."),
      };
    }
  }
}
