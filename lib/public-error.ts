const AUTH =
  /authentication failed|check your credentials|invalid api key|unauthorized|api username|api password/i;
const COLLECTION_OFF =
  /activate collection|can't process operation|cannot process operation|collection (is )?not (active|enabled)/i;
const INSUFFICIENT_MOMO = /momo|mobile money|orange money|insufficient (float|account)/i;
const INSUFFICIENT_WALLET = /insufficient wallet|insufficient (wallet )?balance/i;
const TIMEOUT = /timeout|timed out|etimedout|network.*slow/i;
const DUPLICATE = /duplicate|already (been )?(submitted|processed|exists)/i;
const MTN_DOWN = /mtn.*(unavailable|down|offline)|cm_mtnmomo.*(fail|error)/i;
const ORANGE_DOWN = /orange.*(unavailable|down|offline)|cm_orange.*(fail|error)/i;
const PENDING = /pending|processing|awaiting/;

export type PublicError = { code: string; user: string };

export function mapRailError(raw: unknown): PublicError {
  const text = raw instanceof Error ? raw.message : String(raw || "");
  if (AUTH.test(text)) {
    return {
      code: "AUTHENTICATION_FAILED",
      user: "Payment service is temporarily unavailable. Please try again later or contact support if the problem continues.",
    };
  }
  if (COLLECTION_OFF.test(text)) {
    return {
      code: "COLLECTION_SERVICE_NOT_ACTIVE",
      user: "This payment service is currently unavailable. We're working to restore it. Please try again later.",
    };
  }
  if (INSUFFICIENT_WALLET.test(text)) {
    return {
      code: "INSUFFICIENT_WALLET",
      user: "Insufficient wallet balance. Deposit funds or enter a lower amount.",
    };
  }
  if (INSUFFICIENT_MOMO.test(text)) {
    return {
      code: "INSUFFICIENT_MOMO",
      user: "Your Mobile Money balance is insufficient to complete this transaction. Please top up your account and try again.",
    };
  }
  if (TIMEOUT.test(text)) {
    return {
      code: "NETWORK_TIMEOUT",
      user: "The payment network is taking longer than expected. Please wait a moment while we confirm your transaction. Do not send another payment yet.",
    };
  }
  if (DUPLICATE.test(text)) {
    return {
      code: "DUPLICATE_TRANSACTION",
      user: "This transaction appears to have already been submitted. Please check your transaction history before trying again.",
    };
  }
  if (MTN_DOWN.test(text)) {
    return {
      code: "MTN_UNAVAILABLE",
      user: "MTN Mobile Money is temporarily unavailable. Please try again later or choose another payment method.",
    };
  }
  if (ORANGE_DOWN.test(text)) {
    return {
      code: "ORANGE_UNAVAILABLE",
      user: "Orange Money is temporarily unavailable. Please try again later.",
    };
  }
  if (PENDING.test(text)) {
    return {
      code: "TRANSACTION_PENDING",
      user: "Your transaction is being processed. This usually takes less than two minutes. We'll notify you once it completes.",
    };
  }
  if (/not configured|PAYUNIT_|SESSION_SECRET|CLOUDINARY_/i.test(text)) {
    return {
      code: "SERVICE_UNAVAILABLE",
      user: "Payment service is temporarily unavailable. Please try again later.",
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    user: "Something went wrong. Please try again in a few minutes.",
  };
}

export function publicPaymentError(raw: unknown) {
  const mapped = mapRailError(raw);
  const original = raw instanceof Error ? raw.message : String(raw || "");
  console.error("[lbpay] payment error", { code: mapped.code, original });
  return mapped.user;
}
