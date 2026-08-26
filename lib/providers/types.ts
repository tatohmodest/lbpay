export type RailCollectInput = {
  amount: number;
  currency: "XAF";
  method: "mtn" | "orange" | "card";
  customer: { phone?: string; email?: string };
  reference: string;
};

export type RailDisburseInput = {
  amount: number;
  currency: "XAF";
  network: "mtn" | "orange";
  phone: string;
  reference: string;
};

export type RailResult = {
  provider: "payunit" | "sandbox" | "internal";
  reference: string;
  providerRef?: string;
  status: "success" | "failed" | "pending";
  raw?: unknown;
};

export interface PaymentRail {
  collect(input: RailCollectInput): Promise<RailResult>;
  disburse(input: RailDisburseInput): Promise<RailResult>;
}
