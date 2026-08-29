const AUTH =
  /authentication failed|check your credentials|invalid api key|unauthorized|api username|api password/i;
const COLLECTION_OFF =
  /activate collection|can't process operation|cannot process operation|collection (is )?not (active|enabled)/i;
const INSUFFICIENT_MOMO = /your (momo|mobile money|orange money).{0,40}insufficient|insufficient (momo|mobile money)/i;
const MERCHANT_FLOAT =
  /insufficient (float|merchant|disbursement|payout|account balance)|not enough (balance|funds|float)|low (float|balance)/i;
const APPROVAL = /approval required|is_approval_required|awaiting approval|not approved/i;
const DISBURSE_OFF =
  /disbursement (is )?not (active|enabled)|activate disbursement|deposit (service )?not (active|enabled)|can't process (the )?deposit|cannot process (the )?deposit/i;
const INVALID_ACCOUNT = /invalid (account|phone|msisdn)|account(_| )number|beneficiary/i;
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
      user: "PayUnit rejected this request. Check that the live API keys are correct and that disbursement is enabled on the merchant account.",
    };
  }
  if (COLLECTION_OFF.test(text) || DISBURSE_OFF.test(text)) {
    return {
      code: "COLLECTION_SERVICE_NOT_ACTIVE",
      user: "This payment service is currently unavailable. We're working to restore it. Please try again later.",
    };
  }
  if (INVALID_ACCOUNT.test(text)) {
    return {
      code: "INVALID_ACCOUNT",
      user: "That Mobile Money number could not be paid. Check the number and network, then try again.",
    };
  }
  if (INSUFFICIENT_WALLET.test(text)) {
    return {
      code: "INSUFFICIENT_WALLET",
      user: "Insufficient wallet balance. Deposit funds or enter a lower amount.",
    };
  }
  if (MERCHANT_FLOAT.test(text)) {
    return {
      code: "INSUFFICIENT_MERCHANT_FLOAT",
      user: "PayUnit does not have enough disbursement balance to send this payout. Top up the PayUnit merchant wallet, then try again.",
    };
  }
  if (APPROVAL.test(text)) {
    return {
      code: "DISBURSEMENT_APPROVAL",
      user: "PayUnit created the withdrawal but it is waiting for approval in the PayUnit merchant dashboard.",
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
