import webpush from "web-push";
import { formatXAF } from "@/lib/format";
import { txHref } from "@/lib/tx";
import { sendFcm } from "@/lib/server/fcm";
import {
  getVapidKeys,
  listPushSubscriptions,
  removePushEndpoint,
  saveVapidKeys,
  type StoredTx,
} from "@/lib/server/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type VapidPair = { publicKey: string; privateKey: string; subject: string };

async function ensureVapid(): Promise<VapidPair | null> {
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:support@lbpay.cm";
  const envPublic = process.env.WEB_PUSH_VAPID_PUBLIC_KEY || "";
  const envPrivate = process.env.WEB_PUSH_VAPID_PRIVATE_KEY || "";
  if (envPublic && envPrivate) {
    return { publicKey: envPublic, privateKey: envPrivate, subject };
  }
  const stored = await getVapidKeys();
  if (stored?.publicKey && stored?.privateKey) {
    return { ...stored, subject };
  }
  const generated = webpush.generateVAPIDKeys();
  await saveVapidKeys(generated);
  return { ...generated, subject };
}

export async function getVapidPublicKey() {
  const keys = await ensureVapid();
  return keys?.publicKey || "";
}

async function configure() {
  const keys = await ensureVapid();
  if (!keys) return false;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return true;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const ready = await configure();
  const rows = await listPushSubscriptions(userId);
  if (!rows.length) return { sent: 0 };
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/wallet",
    tag: payload.tag || "lbpay",
  });
  let sent = 0;
  await Promise.all(
    rows.map(async (row) => {
      try {
        if (row.kind === "fcm" && row.token) {
          const result = await sendFcm(row.token, payload);
          if (result === "sent") sent += 1;
          if (result === "gone") await removePushEndpoint(row.endpoint).catch(() => undefined);
          return;
        }
        if (!ready) return;
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removePushEndpoint(row.endpoint).catch(() => undefined);
        } else {
          console.error("[lbpay] web push delivery failed", status || error);
        }
      }
    }),
  );
  return { sent };
}

export async function pushAccount(userId: string, title: string, body: string, url = "/wallet") {
  return sendPushToUser(userId, { title, body, url, tag: `account:${userId}` });
}

export async function pushForTransaction(tx: StoredTx) {
  if (tx.status === "pending") return { sent: 0 };
  const amount = formatXAF(tx.amount);
  const who = tx.counterparty || "LBPay";
  const failed = tx.status !== "success";
  const payload = payloadForTx(tx.kind, amount, who, failed);
  return sendPushToUser(tx.userId, { ...payload, url: txHref(tx.id), tag: `tx:${tx.id}` });
}

function payloadForTx(kind: string, amount: string, who: string, failed: boolean): PushPayload {
  switch (kind) {
    case "receive":
      return {
        title: failed ? "Transfer failed" : "Money received",
        body: failed
          ? `A transfer of ${amount} did not complete.`
          : `${amount} from ${who} is in your wallet.`,
        url: "/wallet/history",
      };
    case "send":
      return {
        title: failed ? "Transfer failed" : "Money sent",
        body: failed
          ? `Your transfer of ${amount} to ${who} failed.`
          : `You sent ${amount} to ${who}.`,
        url: "/wallet/history",
      };
    case "deposit":
      return {
        title: failed ? "Deposit failed" : "Money added",
        body: failed
          ? `Your ${amount} deposit did not go through.`
          : `${amount} was added to your wallet.`,
        url: "/wallet",
      };
    case "withdraw":
      return {
        title: failed ? "Withdrawal failed" : "Money withdrawn",
        body: failed
          ? `${amount} was returned to your wallet.`
          : `${amount} was sent to ${who}.`,
        url: "/wallet/history",
      };
    case "penalty":
      return {
        title: "Missed save · penalty applied",
        body: `${amount} was cut because a save for ${who} was missed. Save today to restart your streak.`,
        url: "/wallet/savings",
      };
    case "savings_in":
      return {
        title: "Saved",
        body: `${amount} moved into ${who}. Keep the streak going.`,
        url: "/wallet/savings",
      };
    case "international":
      return {
        title: failed ? "Transfer abroad failed" : "Transfer abroad delivered",
        body: failed ? `${amount} was returned to your wallet.` : `${amount} was delivered to ${who}.`,
        url: "/wallet/history",
      };
    case "international_in":
      return {
        title: "Money received from abroad",
        body: `${amount} from ${who} is in your wallet.`,
        url: "/wallet/history",
      };
    case "airtime":
    case "data":
      return {
        title: failed ? "Airtime failed" : "Airtime bought",
        body: failed
          ? `Airtime of ${amount} did not go through.`
          : `${amount} airtime was sent to ${who}.`,
        url: "/wallet/airtime",
      };
    case "bill":
      return {
        title: failed ? "Bill payment failed" : "Bill paid",
        body: failed
          ? `Your ${amount} bill payment did not go through.`
          : `You paid ${amount} to ${who}.`,
        url: "/wallet/bills",
      };
    case "collection":
      return {
        title: failed ? "Collection failed" : "Payment collected",
        body: failed
          ? `A ${amount} collection did not complete.`
          : `You collected ${amount} from ${who}.`,
        url: "/business/payments",
      };
    case "payout":
      return {
        title: failed ? "Payout failed" : "Payout sent",
        body: failed
          ? `A ${amount} payout to ${who} failed.`
          : `${amount} was paid out to ${who}.`,
        url: "/developers/payouts",
      };
    case "adjustment":
      return {
        title: "Wallet updated",
        body: failed
          ? `A wallet adjustment of ${amount} did not complete.`
          : `Your wallet was adjusted by ${amount}.`,
        url: "/wallet",
      };
    case "reversal":
      return {
        title: "Transaction reversed",
        body: `${amount} was reversed on your wallet.`,
        url: "/wallet/history",
      };
    default:
      return {
        title: failed ? "Transaction failed" : "Transaction update",
        body: failed
          ? `A ${amount} transaction did not complete.`
          : `${amount} · ${kind.replace(/_/g, " ")}`,
        url: "/wallet/history",
      };
  }
}
