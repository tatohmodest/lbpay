import { uid } from "@/lib/format";
import { getPaymentRail } from "@/lib/providers";
import { internalTransfer } from "./ledger";

export async function collectPayment(input: {
  amount: number;
  method: "mtn" | "orange" | "card" | "wallet";
  customer: { phone?: string };
  description?: string;
}) {
  const reference = uid("pay");
  if (input.method === "wallet") {
    return {
      id: reference,
      status: "success" as const,
      rail: "internal",
      entries: internalTransfer({
        fromWalletId: "wallet_customer",
        toWalletId: "wallet_merchant",
        amount: input.amount,
        transactionId: reference,
      }),
    };
  }

  const rail = getPaymentRail();
  const result = await rail.collect({
    amount: input.amount,
    currency: "XAF",
    method: input.method,
    customer: input.customer,
    reference,
  });

  return {
    id: reference,
    status: result.status,
    rail: result.provider,
    description: input.description,
    providerRef: result.providerRef,
  };
}

export async function sendPayout(input: {
  amount: number;
  phone: string;
  network: "mtn" | "orange";
}) {
  const reference = uid("po");
  const rail = getPaymentRail();
  const result = await rail.disburse({
    amount: input.amount,
    currency: "XAF",
    network: input.network,
    phone: input.phone,
    reference,
  });
  return { id: reference, status: result.status, rail: result.provider };
}
