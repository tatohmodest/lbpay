import { PayunitClient } from "@payunit/nodejs-sdk";
import { httpsCallbackUrl, payunitGatewayUrl } from "@/lib/site";
import { cameroonMsisdn } from "@/lib/phone";
import { publicPaymentError } from "@/lib/public-error";
import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult, RailStatusOptions } from "./types";
import {
  disbursementAccount,
  isTimeoutError,
  pickPayToken,
  pickStatusRaw,
  pickTransactionId,
  railStatus,
  sanitizeDisburseText,
  unwrapPayunitBody,
} from "./payunit-parse";

type PayUnitMode = "test" | "live";

function collectionPhone(phone?: string) {
  return cameroonMsisdn(phone);
}

function gateway(method: "mtn" | "orange" | "card") {
  if (method === "orange") return "CM_ORANGE" as const;
  if (method === "mtn") return "CM_MTNMOMO" as const;
  return undefined;
}

function errorMessage(error: unknown, fallback: string) {
  const raw = error instanceof Error && error.message ? error.message.replace(/^API request failed:\s*/i, "") : fallback;
  console.error("[lbpay] payunit raw error", raw);
  return publicPaymentError(raw);
}

export function createPayunitClient(timeout = 45_000) {
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
    timeout,
  });
}

/**
 * Official PayUnit path from developer.payunit.net:
 * create POST /api/gateway/deposit, confirm POST /api/gateway/deposit/confirm,
 * then poll GET /api/gateway/deposit/deposit_status/{pay_token}.
 * Collection phones stay 9-digit MSISDN; disbursement account_number is 237 + MSISDN.
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

    const accountNumber = disbursementAccount(input.phone);
    if (!accountNumber) {
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message: "Enter a valid Cameroon mobile number.",
      };
    }

    const amount = Math.round(Number(input.amount));
    if (!Number.isFinite(amount) || amount < 1) {
      return {
        provider: "payunit",
        reference: input.reference,
        status: "failed",
        message: "Enter an amount.",
      };
    }

    const beneficiaryName = sanitizeDisburseText(input.beneficiaryName, "LBPay user", 60);
    const depositMessage = sanitizeDisburseText(input.note, "LBPay disbursement", 80);
    const depositNote = sanitizeDisburseText(input.note, "Wallet withdrawal", 80);
    const notifyUrl = this.notifyUrl();

    try {
      const created = await this.client.disbursement.createDisbursement({
        destination_currency: input.currency,
        debit_currency: input.currency,
        account_number: accountNumber,
        amount,
        beneficiary_name: beneficiaryName,
        deposit_type: "MOBILE_MONEY",
        transaction_id: input.reference,
        country: "CM",
        account_bank: provider,
      });
      const payToken = pickPayToken(created);
      if (!payToken) {
        console.error("[lbpay] payunit create disbursement missing pay_token", created);
        return {
          provider: "payunit",
          reference: input.reference,
          status: "failed",
          message: "PayUnit did not start the withdrawal. Please try again.",
          raw: created,
        };
      }

      let confirmed: unknown;
      try {
        confirmed = await this.client.disbursement.confirmDisbursement({
          pay_token: payToken,
          deposit_message: depositMessage,
          deposit_note: depositNote,
          notify_url: notifyUrl,
        });
      } catch (confirmError) {
        if (isTimeoutError(confirmError)) {
          return {
            provider: "payunit",
            reference: input.reference,
            providerRef: payToken,
            status: "pending",
            message: "Your withdrawal is being processed. This usually takes less than two minutes.",
            raw: { created, confirmError: "timeout" },
          };
        }
        try {
          confirmed = await this.client.disbursement.confirmDisbursement({
            pay_token: payToken,
            deposit_message: depositMessage,
            deposit_note: depositNote,
          });
        } catch (retryError) {
          if (isTimeoutError(retryError)) {
            return {
              provider: "payunit",
              reference: input.reference,
              providerRef: payToken,
              status: "pending",
              message: "Your withdrawal is being processed. This usually takes less than two minutes.",
              raw: { created, confirmError: retryError },
            };
          }
          throw retryError;
        }
      }

      const body = unwrapPayunitBody(confirmed);
      const approvalRequired = Boolean(body.is_approval_required) && body.is_approved !== true;
      const status = approvalRequired
        ? "pending"
        : railStatus(pickStatusRaw(confirmed) || String(body.status || ""));
      return {
        provider: "payunit",
        reference: pickTransactionId(confirmed, input.reference),
        providerRef: payToken,
        status: status === "failed" ? "failed" : status === "success" ? "success" : "pending",
        message: approvalRequired
          ? "PayUnit created the withdrawal but it is waiting for approval in the PayUnit merchant dashboard."
          : status === "failed"
            ? publicPaymentError(String(body.system_note || body.message || "failed"))
            : undefined,
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

  async getStatus(reference: string, options?: RailStatusOptions): Promise<RailResult> {
    const kind = options?.kind;
    let collectResult: RailResult | null = null;

    if (kind !== "disburse") {
      try {
        const status = await this.client.collections.getTransactionStatus(reference);
        const mapped = railStatus(status.transaction_status);
        collectResult = {
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
        if (kind === "collect" || mapped !== "failed") return collectResult;
      } catch (error) {
        if (kind === "collect") {
          return {
            provider: "payunit",
            reference,
            status: "pending",
            message: errorMessage(error, "Payment is still waiting on the phone."),
          };
        }
      }
    }

    const disbursed = await this.readDisbursementStatus(reference, options?.payToken);
    if (disbursed) return disbursed;
    if (collectResult) return collectResult;

    return {
      provider: "payunit",
      reference,
      providerRef: options?.payToken,
      status: "pending",
      message: "Your transaction is being processed. This usually takes less than two minutes.",
    };
  }

  /**
   * Official SDK getDisbursementStatus hits `/deposit_status${token}` (missing slash).
   * Call the documented path ourselves, then fall back to the SDK with a leading slash.
   */
  private async readDisbursementStatus(reference: string, payToken?: string): Promise<RailResult | null> {
    const ids = payToken
      ? [payToken]
      : [...new Set([reference].filter((value): value is string => Boolean(value)))];
    for (const id of ids) {
      try {
        const response = await this.client.request<unknown>(
          "GET",
          `/gateway/deposit/deposit_status/${encodeURIComponent(id)}`,
        );
        const body = unwrapPayunitBody(response);
        const rawStatus = pickStatusRaw(response) || String(body.payment_status || body.status || "");
        const mapped = railStatus(rawStatus);
        const responseReference = pickTransactionId(response, "");
        const responsePayToken = pickPayToken(response);
        const failureNote = String(body.system_note || body.message || rawStatus || "").toLowerCase();
        if (!rawStatus && !body.payment_status && !body.status && !body.transaction_id) {
          continue;
        }

        // Guard against lookup/transport-style failures being treated as terminal payout failure.
        if (
          mapped === "failed" &&
          !responseReference &&
          !responsePayToken &&
          /not\s*found|unknown|invalid|missing|timeout|temporar|try again|processing|pending|unavailable/i.test(
            failureNote,
          )
        ) {
          continue;
        }

        return {
          provider: "payunit",
          reference: responseReference || reference,
          providerRef: responsePayToken || payToken || id,
          status: mapped,
          message:
            mapped === "failed"
              ? publicPaymentError(String(body.system_note || body.message || "failed"))
              : mapped === "pending"
                ? "Your transaction is being processed. This usually takes less than two minutes."
                : undefined,
          raw: response,
        };
      } catch {
        /* try the next id or the SDK fallback */
      }
    }

    if (payToken) {
      try {
        const status = await this.client.disbursement.getDisbursementStatus(`/${payToken}`);
        return {
          provider: "payunit",
          reference: status.transaction_id || reference,
          providerRef: payToken,
          status: railStatus(status.payment_status),
          message:
            railStatus(status.payment_status) === "failed"
              ? publicPaymentError(status.system_note || "failed")
              : undefined,
          raw: status,
        };
      } catch {
        return null;
      }
    }

    return null;
  }
}
