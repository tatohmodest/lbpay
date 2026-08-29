export type RailCollectInput = {
  amount: number;
  currency: "XAF";
  method: "mtn" | "orange" | "card";
  customer: { phone?: string; email?: string; name?: string };
  reference: string;
  returnUrl?: string;
};

export type RailDisburseInput = {
  amount: number;
  currency: "XAF";
  network: "mtn" | "orange";
  phone: string;
  reference: string;
  beneficiaryName?: string;
  note?: string;
};

export type RailResult = {
  provider: "payunit" | "sandbox" | "internal";
  reference: string;
  providerRef?: string;
  status: "success" | "failed" | "pending";
  message?: string;
  raw?: unknown;
  hostedUrl?: string;
};

export type RailStatusOptions = {
  payToken?: string;
  kind?: "collect" | "disburse";
};

export interface PaymentRail {
  collect(input: RailCollectInput): Promise<RailResult>;
  disburse(input: RailDisburseInput): Promise<RailResult>;
  getStatus?(reference: string, options?: RailStatusOptions): Promise<RailResult>;
}
