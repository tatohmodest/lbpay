"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { initialState } from "@/lib/demo/seed";
import { slugify, uid } from "@/lib/format";
import type {
  ApiEnvironment,
  AppState,
  PaymentMethod,
  TransactionKind,
} from "@/lib/types";

const STORAGE_KEY = "lbpay.demo.v1";

type SendInput = {
  amount: number;
  to: string;
  network?: "mtn" | "orange" | "wallet";
  note?: string;
};

type AppContextValue = {
  state: AppState;
  login: () => void;
  logout: () => void;
  setEnvironment: (env: ApiEnvironment) => void;
  sendMoney: (input: SendInput) => { ok: boolean; message: string };
  deposit: (amount: number, method: PaymentMethod) => { ok: boolean; message: string };
  withdraw: (amount: number, method: Exclude<PaymentMethod, "card" | "wallet">) => {
    ok: boolean;
    message: string;
  };
  buyAirtime: (amount: number, phone: string, network: "mtn" | "orange") => {
    ok: boolean;
    message: string;
  };
  payBill: (amount: number, biller: string) => { ok: boolean; message: string };
  createLink: (title: string, amount: number | null) => { slug: string };
  createRequest: (toName: string, amount: number, message: string) => { id: string };
  createPayout: (amount: number, phone: string, network: "mtn" | "orange") => void;
  clearToast: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

let memory = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...(JSON.parse(raw) as AppState), toast: null };
  } catch {
    return initialState;
  }
}

if (typeof window !== "undefined") {
  memory = readStorage();
}

function persist(next: AppState) {
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, toast: null }));
  } catch {
    /* private mode */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function pushTx(
  state: AppState,
  partial: {
    kind: TransactionKind;
    amount: number;
    fee?: number;
    method: PaymentMethod;
    counterparty: string;
    note?: string;
    status?: AppState["transactions"][number]["status"];
  },
): AppState {
  const tx = {
    id: uid("TXN").toUpperCase(),
    kind: partial.kind,
    amount: partial.amount,
    fee: partial.fee ?? 0,
    status: partial.status ?? "success",
    method: partial.method,
    counterparty: partial.counterparty,
    note: partial.note,
    createdAt: new Date().toISOString(),
  };
  return { ...state, transactions: [tx, ...state.transactions] };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, () => memory, () => initialState);

  const login = useCallback(() => {
    persist({
      ...memory,
      session: true,
      toast: `Welcome back, ${memory.user.name.split(" ")[0]}`,
    });
  }, []);

  const logout = useCallback(() => {
    persist({ ...memory, session: false, toast: "Signed out" });
  }, []);

  const setEnvironment = useCallback((env: ApiEnvironment) => {
    persist({ ...memory, environment: env, toast: `Switched to ${env}` });
  }, []);

  const sendMoney = useCallback((input: SendInput) => {
    if (input.amount <= 0) return { ok: false, message: "Enter a valid amount" };
    if (input.amount > memory.balance) {
      persist({ ...memory, toast: "Insufficient wallet balance" });
      return { ok: false, message: "Insufficient wallet balance" };
    }
    const isHandle = input.to.startsWith("@") || input.network === "wallet";
    const fee = isHandle ? 0 : Math.max(100, Math.round(input.amount * 0.015));
    const next = pushTx(memory, {
      kind: isHandle ? "send" : "cross_network",
      amount: input.amount,
      fee,
      method: isHandle ? "wallet" : input.network === "orange" ? "orange" : "mtn",
      counterparty: input.to,
      note: input.note ?? (isHandle ? "LBPay transfer" : "Cross-network send"),
    });
    persist({
      ...next,
      balance: memory.balance - input.amount - fee,
      toast: isHandle
        ? `Sent ${input.amount.toLocaleString()} XAF to ${input.to}`
        : `Sent ${input.amount.toLocaleString()} XAF to ${input.to} on ${input.network?.toUpperCase()}`,
    });
    return { ok: true, message: "Sent" };
  }, []);

  const deposit = useCallback((amount: number, method: PaymentMethod) => {
    if (amount <= 0) return { ok: false, message: "Enter a valid amount" };
    const next = pushTx(memory, {
      kind: "deposit",
      amount,
      method,
      counterparty:
        method === "mtn" ? "MTN Mobile Money" : method === "orange" ? "Orange Money" : "Card",
    });
    persist({
      ...next,
      balance: memory.balance + amount,
      toast: `Deposited ${amount.toLocaleString()} XAF`,
    });
    return { ok: true, message: "Deposit initiated" };
  }, []);

  const withdraw = useCallback(
    (amount: number, method: Exclude<PaymentMethod, "card" | "wallet">) => {
      if (amount <= 0) return { ok: false, message: "Enter a valid amount" };
      if (amount > memory.balance) {
        persist({ ...memory, toast: "Insufficient wallet balance" });
        return { ok: false, message: "Insufficient wallet balance" };
      }
      const next = pushTx(memory, {
        kind: "withdraw",
        amount,
        method,
        counterparty: method === "mtn" ? "MTN Mobile Money" : "Orange Money",
      });
      persist({
        ...next,
        balance: memory.balance - amount,
        toast: `Withdrawing ${amount.toLocaleString()} XAF`,
      });
      return { ok: true, message: "Withdrawal started" };
    },
    [],
  );

  const buyAirtime = useCallback(
    (amount: number, phone: string, network: "mtn" | "orange") => {
      if (amount <= 0) return { ok: false, message: "Enter a valid amount" };
      if (amount > memory.balance) {
        persist({ ...memory, toast: "Insufficient wallet balance" });
        return { ok: false, message: "Insufficient wallet balance" };
      }
      const next = pushTx(memory, {
        kind: "airtime",
        amount,
        method: "wallet",
        counterparty: `${network.toUpperCase()} ${phone}`,
      });
      persist({
        ...next,
        balance: memory.balance - amount,
        toast: `Airtime sent to ${phone}`,
      });
      return { ok: true, message: "Airtime purchased" };
    },
    [],
  );

  const payBill = useCallback((amount: number, biller: string) => {
    if (amount <= 0) return { ok: false, message: "Enter a valid amount" };
    if (amount > memory.balance) {
      persist({ ...memory, toast: "Insufficient wallet balance" });
      return { ok: false, message: "Insufficient wallet balance" };
    }
    const next = pushTx(memory, {
      kind: "bill",
      amount,
      method: "wallet",
      counterparty: biller,
    });
    persist({
      ...next,
      balance: memory.balance - amount,
      toast: `Paid ${biller}`,
    });
    return { ok: true, message: "Bill paid" };
  }, []);

  const createLink = useCallback((title: string, amount: number | null) => {
    const slug = slugify(title) || uid("pay");
    persist({
      ...memory,
      links: [
        {
          id: uid("lnk"),
          slug,
          title,
          amount,
          status: "active",
          collected: 0,
          payments: 0,
          createdAt: new Date().toISOString(),
        },
        ...memory.links,
      ],
      business: {
        ...memory.business,
        activeLinks: memory.business.activeLinks + 1,
      },
      toast: "Payment link created",
    });
    return { slug };
  }, []);

  const createRequest = useCallback((toName: string, amount: number, message: string) => {
    const id = uid("req");
    persist({
      ...memory,
      requests: [
        {
          id,
          toName,
          amount,
          message,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        ...memory.requests,
      ],
      toast: "Payment request created",
    });
    return { id };
  }, []);

  const createPayout = useCallback(
    (amount: number, phone: string, network: "mtn" | "orange") => {
      persist({
        ...memory,
        payouts: [
          {
            id: uid("po"),
            amount,
            phone,
            network,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          ...memory.payouts,
        ],
        logs: [
          {
            id: uid("log"),
            status: 200,
            method: "POST",
            path: "/v1/payouts",
            createdAt: new Date().toISOString(),
          },
          ...memory.logs,
        ],
        toast: "Payout queued",
      });
    },
    [],
  );

  const clearToast = useCallback(() => {
    persist({ ...memory, toast: null });
  }, []);

  const value = useMemo(
    () => ({
      state,
      login,
      logout,
      setEnvironment,
      sendMoney,
      deposit,
      withdraw,
      buyAirtime,
      payBill,
      createLink,
      createRequest,
      createPayout,
      clearToast,
    }),
    [
      state,
      login,
      logout,
      setEnvironment,
      sendMoney,
      deposit,
      withdraw,
      buyAirtime,
      payBill,
      createLink,
      createRequest,
      createPayout,
      clearToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
