"use client";

import { ReceiveView } from "@/components/receive-view";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { payHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

/** Receive money: a "pay me" card people can scan, tap, or open from a shared link. */
export default function WalletQrPage() {
  const { state } = useApp();
  const me = useMe();
  const user = me.data?.user;
  const handle = user?.lbpayId || state.user.lbpayId;
  const origin = useBrowserOrigin();
  return (
    <ReceiveView
      handle={handle}
      name={user?.businessName || user?.name || state.user.name}
      avatar={user?.avatar || state.user.avatar}
      verified={user?.kyc?.personal === "verified"}
      payUrl={handle && origin ? payHandleUrl(handle, origin) : ""}
    />
  );
}

