import { emptyProfile } from "@/lib/roles";
import type { AppState } from "@/lib/types";

export const initialState: AppState = {
  session: false,
  pinUnlocked: false,
  user: emptyProfile(),
  balance: 0,
  environment: "sandbox",
  toast: null,
  transactions: [],
  beneficiaries: [],
  links: [],
  requests: [],
  business: {
    name: "",
    revenue: 0,
    activeLinks: 0,
    nextPayout: 0,
    nextPayoutAt: "—",
    settlementStatus: "pending",
  },
  apiKeys: [],
  logs: [],
  webhooks: [],
  payouts: [],
  subscriptions: [],
};
