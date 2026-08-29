import { findTxByRailRef, patchTx, recordLedgerMove } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { payunitReference } from "@/lib/server/crypto";
import { publicPaymentError } from "@/lib/public-error";

function collectNeedsCheck(meta: { stage?: string; payoutRef?: string }) {
  return meta.stage !== "paying" && meta.stage !== "done" && !meta.payoutRef;
}

const inflight = new Map<string, Promise<QuickProgress>>();

export type QuickProgress = {
  status: "pending" | "success" | "failed";
  stage: "collecting" | "paying" | "done";
  message?: string;
  transactionId: string;
};

export async function progressQuickTransfer(collectRef: string): Promise<QuickProgress> {
  const existing = inflight.get(collectRef);
  if (existing) return existing;
  const run = progressQuickTransferInner(collectRef).finally(() => inflight.delete(collectRef));
  inflight.set(collectRef, run);
  return run;
}

async function failPayout(tx: NonNullable<Awaited<ReturnType<typeof findTxByRailRef>>>, meta: NonNullable<(typeof tx)["meta"]>, payoutRef: string) {
  if (!meta.refunded) {
    await recordLedgerMove({
      userId: tx.userId,
      amount: tx.amount,
      direction: "credit",
      kind: "adjustment",
      method: "wallet",
      counterparty: meta.to || tx.counterparty,
      note: "Quick transfer payout failed. Amount returned to your wallet.",
      status: "success",
      rail: "internal",
    });
  }
  await patchTx(tx.id, {
    status: "failed",
    meta: { ...meta, stage: "done", payoutRef, refunded: true },
    note: `${tx.note || "Quick transfer"} · payout failed, returned to wallet`,
  });
  return {
    status: "failed" as const,
    stage: "done" as const,
    transactionId: tx.railRef || payoutRef,
    message: "The transfer could not be paid out. The amount has been returned to your LBPay wallet.",
  };
}

async function progressQuickTransferInner(collectRef: string): Promise<QuickProgress> {
  const tx = await findTxByRailRef(collectRef);
  if (!tx || tx.kind !== "cross_network") {
    return {
      status: "failed",
      stage: "done",
      transactionId: collectRef,
      message: "This transfer could not be found.",
    };
  }
  if (tx.status === "success") {
    return { status: "success", stage: "done", transactionId: tx.railRef || collectRef };
  }
  if (tx.status === "failed" || tx.status === "cancelled") {
    return {
      status: "failed",
      stage: "done",
      transactionId: tx.railRef || collectRef,
      message: "Your transaction could not be completed. No money has been deducted. Please try again.",
    };
  }

  const meta = tx.meta || {};
  const rail = getPaymentRail();
  const to = meta.to;
  const toNetwork = meta.toNetwork === "orange" ? "orange" : "mtn";
  const collectId = tx.railRef || collectRef;

  if (collectNeedsCheck(meta)) {
    const collect = rail.getStatus
      ? await rail.getStatus(collectId, { kind: "collect" })
      : { status: "pending" as const, reference: collectId, message: undefined };

    if (collect.status === "pending") {
      return { status: "pending", stage: "collecting", transactionId: collectId };
    }
    if (collect.status === "failed") {
      await patchTx(tx.id, { status: "failed" });
      return {
        status: "failed",
        stage: "done",
        transactionId: collectId,
        message:
          collect.message ||
          "Your transaction could not be completed. No money has been deducted. Please try again.",
      };
    }
  }

  if (!to) {
    await patchTx(tx.id, { status: "failed" });
    return {
      status: "failed",
      stage: "done",
      transactionId: collectId,
      message: "Something went wrong. Please try again in a few minutes.",
    };
  }

  if (meta.payoutRef) {
    if (rail.getStatus) {
      const existing = await rail.getStatus(meta.payoutRef, {
        kind: "disburse",
        payToken: meta.payToken,
      });
      if (existing.status === "success") {
        await patchTx(tx.id, {
          status: "success",
          meta: { ...meta, stage: "done" },
        });
        return { status: "success", stage: "done", transactionId: collectId };
      }
      if (existing.status === "failed") {
        return failPayout(tx, meta, meta.payoutRef);
      }
    }
    return {
      status: "pending",
      stage: "paying",
      transactionId: collectId,
      message: "We are sending the money now. This usually takes less than two minutes.",
    };
  }

  const payoutRef = payunitReference("QT");
  await patchTx(tx.id, { meta: { ...meta, stage: "paying", payoutRef } });

  try {
    const payout = await rail.disburse({
      amount: tx.amount,
      currency: "XAF",
      network: toNetwork,
      phone: to,
      reference: payoutRef,
      beneficiaryName: "LBPay transfer",
      note: `Quick transfer to ${to}`,
    });
    const nextMeta = { ...meta, stage: "paying" as const, payoutRef, payToken: payout.providerRef };
    if (payout.status === "failed") {
      return failPayout(tx, nextMeta, payoutRef);
    }
    if (payout.status === "success") {
      await patchTx(tx.id, {
        status: "success",
        meta: { ...nextMeta, stage: "done" },
      });
      return { status: "success", stage: "done", transactionId: collectId };
    }
    await patchTx(tx.id, { meta: nextMeta });
    return {
      status: "pending",
      stage: "paying",
      transactionId: collectId,
      message: "We are sending the money now. This usually takes less than two minutes.",
    };
  } catch (error) {
    return {
      status: "pending",
      stage: "paying",
      transactionId: collectId,
      message: publicPaymentError(error),
    };
  }
}
