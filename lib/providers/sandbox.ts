import type { PaymentRail, RailCollectInput, RailDisburseInput, RailResult } from "./types";

function simulateStatus(reference: string, amount: number): RailResult["status"] {
  if (amount % 100 === 13 || reference.endsWith("fail")) return "failed";
  if (amount % 100 === 77 || reference.endsWith("pend")) return "pending";
  return "success";
}

export class SandboxRail implements PaymentRail {
  async collect(input: RailCollectInput): Promise<RailResult> {
    return {
      provider: "sandbox",
      reference: input.reference,
      providerRef: `sbx_${input.reference}`,
      status: simulateStatus(input.reference, input.amount),
    };
  }

  async disburse(input: RailDisburseInput): Promise<RailResult> {
    return {
      provider: "sandbox",
      reference: input.reference,
      providerRef: `sbx_${input.reference}`,
      status: simulateStatus(input.reference, input.amount),
    };
  }

  async getStatus(reference: string): Promise<RailResult> {
    return {
      provider: "sandbox",
      reference,
      providerRef: `sbx_${reference}`,
      status: simulateStatus(reference, 0),
    };
  }
}
