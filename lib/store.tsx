"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { emptyProfile } from "@/lib/roles";
import type { AppState, Transaction, UserProfile } from "@/lib/types";

const STORAGE_KEY = "lbpay.session.v3";

const emptyState: AppState = {
  session: false,
  pinUnlocked: false,
  user: emptyProfile(),
  balance: 0,
  environment: "live",
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
    nextPayoutAt: "",
    settlementStatus: "pending",
  },
  apiKeys: [],
  logs: [],
  webhooks: [],
  payouts: [],
  subscriptions: [],
};

type AppContextValue = {
  state: AppState;
  login: () => void;
  logout: () => void;
  lockPin: () => void;
  unlockPin: () => void;
  hydrateFromServer: (input: {
    user: UserProfile;
    balance: number;
    transactions: Transaction[];
  }) => void;
  clearToast: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

let memory = emptyState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...emptyState,
      user: parsed.user || emptyState.user,
      session: false,
      pinUnlocked: false,
      toast: null,
    };
  } catch {
    return emptyState;
  }
}

if (typeof window !== "undefined") {
  memory = readStorage();
}

function persist(next: AppState) {
  memory = next;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: next.user }),
    );
  } catch {
    /* private mode */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, () => memory, () => emptyState);

  const login = useCallback(() => {
    persist({ ...memory, session: true, pinUnlocked: true, toast: null });
  }, []);

  const logout = useCallback(() => {
    persist({ ...emptyState });
  }, []);

  const lockPin = useCallback(() => {
    persist({ ...memory, pinUnlocked: false });
  }, []);

  const unlockPin = useCallback(() => {
    persist({ ...memory, pinUnlocked: true });
  }, []);

  const hydrateFromServer = useCallback(
    (input: { user: UserProfile; balance: number; transactions: Transaction[] }) => {
      persist({
        ...memory,
        session: true,
        user: input.user,
        balance: input.balance,
        transactions: input.transactions,
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
      lockPin,
      unlockPin,
      hydrateFromServer,
      clearToast,
    }),
    [state, login, logout, lockPin, unlockPin, hydrateFromServer, clearToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
