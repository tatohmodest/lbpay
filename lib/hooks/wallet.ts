"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatXAF } from "@/lib/format";
import { readApiJson } from "@/lib/http";

export type MeResponse = {
  session: boolean;
  user?: {
    id: string;
    name: string;
    lbpayId: string;
    email: string;
    phone: string;
    avatar: string;
    kycStatus: string;
    emailVerified: boolean;
    pinSet: boolean;
    roles: Array<"personal" | "business" | "developer" | "admin">;
    status: "active" | "frozen";
    kyc: { personal: string; business: string; developer: string };
    businessName?: string;
    businessKind?: "small" | "branded";
  };
  balance?: number;
  adminStep?: boolean;
  keys?: Array<{ id: string; env: string; publicKey: string; secretMasked: string; createdAt: string }>;
  links?: Array<{ id: string; slug: string; title: string; amount: number | null; status: string }>;
  transactions?: Array<{
    id: string;
    kind: string;
    amount: number;
    fee: number;
    status: string;
    method: string;
    counterparty: string;
    note?: string;
    createdAt: string;
    railRef?: string;
    rail?: string;
    meta?: {
      from?: string;
      to?: string;
      fromNetwork?: string;
      toNetwork?: string;
      stage?: string;
      payoutRef?: string;
      linkSlug?: string;
      handle?: string;
      refunded?: boolean;
    };
  }>;
};

async function parseApi<T>(res: Response): Promise<T> {
  const data = await readApiJson<T & { error?: string; retryAfter?: number }>(res);
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { retryAfter?: number };
    if (data.retryAfter) err.retryAfter = data.retryAfter;
    throw err;
  }
  return data as T;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (res.status === 401) return { session: false } as MeResponse;
      return parseApi<MeResponse>(res);
    },
  });
}

export function useTransfer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { to: string; amount: number; pin: string; note?: string }) =>
      fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((res) => parseApi(res)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useDisburse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      phone: string;
      network: "mtn" | "orange";
      pin: string;
      note?: string;
    }) =>
      fetch("/api/wallet/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((res) => parseApi(res)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useCollect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      method: "mtn" | "orange" | "card";
      phone?: string;
      pin: string;
    }) =>
      fetch("/api/wallet/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((res) => parseApi(res)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useHandleLookup(query: string) {
  const q = query.trim();
  const handle = q.replace(/^@/, "");
  const looksLikeHandle = handle.length >= 2 && !/^\d/.test(handle);
  return useQuery({
    queryKey: ["lookup", handle],
    enabled: looksLikeHandle,
    queryFn: async () => {
      const res = await fetch(`/api/wallet/lookup?q=${encodeURIComponent(handle)}`);
      return parseApi<{ found: boolean; user?: { name: string; lbpayId: string; avatar: string } }>(res);
    },
    staleTime: 20_000,
  });
}

export function useQuickTransfer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      from: string;
      to: string;
      fromNetwork: "mtn" | "orange";
      toNetwork: "mtn" | "orange";
      pin: string;
    }) =>
      fetch("/api/wallet/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((res) => parseApi(res)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useSpend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; pin: string; kind: "airtime" | "bill"; counterparty: string; note?: string }) =>
      fetch("/api/wallet/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((res) => parseApi(res)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function moneyLabel(amount: number) {
  return formatXAF(amount);
}
