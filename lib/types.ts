export type PaymentMethod = "mtn" | "orange" | "card" | "wallet";
export type TransactionStatus =
  | "success"
  | "failed"
  | "pending"
  | "cancelled"
  | "expired";
export type TransactionKind =
  | "send"
  | "receive"
  | "deposit"
  | "withdraw"
  | "airtime"
  | "data"
  | "bill"
  | "cross_network"
  | "collection"
  | "payout"
  | "request"
  | "split"
  | "subscription"
  | "adjustment"
  | "reversal";

export type AccountKind = "personal" | "business" | "developer" | "admin";
export type AccountStatus = "active" | "frozen";
export type KycTrack = "personal" | "business" | "developer";
export type KycState = "unverified" | "pending" | "verified" | "rejected";

export type UserProfile = {
  id: string;
  name: string;
  lbpayId: string;
  email: string;
  phone: string;
  avatar: string;
  kycStatus: KycState;
  roles: AccountKind[];
  status: AccountStatus;
  kyc: Record<KycTrack, KycState>;
  businessName?: string;
  businessKind?: "small" | "branded";
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amount: number;
  fee: number;
  status: TransactionStatus;
  method: PaymentMethod;
  counterparty: string;
  note?: string;
  createdAt: string;
  railRef?: string;
};

export type Beneficiary = {
  id: string;
  name: string;
  phone?: string;
  lbpayId?: string;
  network?: "mtn" | "orange";
};

export type PaymentLink = {
  id: string;
  slug: string;
  title: string;
  amount: number | null;
  status: "active" | "inactive";
  collected: number;
  payments: number;
  createdAt: string;
  imageUrl?: string;
  imagePublicId?: string;
  template?: string;
};

export type MoneyRequest = {
  id: string;
  toName: string;
  toHandle?: string;
  amount: number;
  message: string;
  status: "pending" | "paid" | "declined";
  createdAt: string;
};

export type BusinessMetrics = {
  name: string;
  revenue: number;
  activeLinks: number;
  nextPayout: number;
  nextPayoutAt: string;
  settlementStatus: "clear" | "pending";
};

export type ApiEnvironment = "live" | "sandbox";

export type ApiKeyPair = {
  env: ApiEnvironment;
  publicKey: string;
  secretKeyMasked: string;
};

export type ApiLog = {
  id: string;
  status: number;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  createdAt: string;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
};

export type Payout = {
  id: string;
  amount: number;
  phone: string;
  network: "mtn" | "orange";
  status: TransactionStatus;
  createdAt: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  amount: number;
  interval: "weekly" | "monthly" | "yearly";
  subscribers: number;
  status: "active" | "paused";
};

export type AppState = {
  session: boolean;
  pinUnlocked: boolean;
  user: UserProfile;
  balance: number;
  environment: ApiEnvironment;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  links: PaymentLink[];
  requests: MoneyRequest[];
  business: BusinessMetrics;
  apiKeys: ApiKeyPair[];
  logs: ApiLog[];
  webhooks: WebhookEndpoint[];
  payouts: Payout[];
  subscriptions: SubscriptionPlan[];
  toast: string | null;
};
