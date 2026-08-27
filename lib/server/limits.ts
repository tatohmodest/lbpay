import { listTx } from "@/lib/server/db";
import {
  amountIssue,
  cameroonDay,
  dailyOutboundCap,
  limitsFor,
  outboundKinds,
  type LimitKind,
} from "@/lib/limits";
import { formatXAF } from "@/lib/format";
import type { StoredUser } from "@/lib/server/db";

export async function assertAmount(amount: number, kind: LimitKind) {
  const issue = amountIssue(amount, kind);
  if (issue) {
    const err = new Error(issue);
    throw err;
  }
}

export async function assertDailyOutbound(user: StoredUser, amount: number) {
  const cap = dailyOutboundCap(user.kyc?.personal);
  if (!cap) return;
  const used = await outboundUsedToday(user.id);
  if (used + amount > cap) {
    const left = Math.max(0, cap - used);
    throw new Error(
      left
        ? `Daily limit remaining is ${formatXAF(left)}. Try a lower amount or wait until tomorrow.`
        : `Daily limit of ${formatXAF(cap)} reached. Try again tomorrow.`,
    );
  }
}

export async function outboundUsedToday(userId: string) {
  const today = cameroonDay();
  const txs = await listTx(userId);
  return txs
    .filter(
      (tx) =>
        outboundKinds(tx.kind) &&
        cameroonDay(tx.createdAt) === today &&
        (tx.status === "success" || tx.status === "pending"),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function limitCopy(kind: LimitKind) {
  const { min, max } = limitsFor(kind);
  return { min, max };
}
