import type { Metadata } from "next";
import { findUserByHandle } from "@/lib/server/db";
import { shareImage, shareMetadata, shareOrigin } from "@/lib/server/share-meta";
import { DEFAULT_AVATAR, resolveAvatar } from "@/lib/avatar";

type Props = { params: Promise<{ handle: string }>; children: React.ReactNode };

/** Preview for "pay me" links: /p/@handle */
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw || "").replace(/^@/, "").trim().toLowerCase();
  const user = handle ? await findUserByHandle(handle) : null;
  if (!user) return { title: "Pay on LBPay", robots: { index: false, follow: false } };

  const name = user.businessName || user.name;
  const origin = await shareOrigin();
  const avatar = resolveAvatar(user.avatar);
  return shareMetadata({
    title: `Pay ${name} on LBPay`,
    description: `Send money to @${user.lbpayId} in seconds with MTN MoMo, Orange Money or your LBPay wallet. Free between LBPay wallets.`,
    path: `/p/${encodeURIComponent(user.lbpayId)}`,
    origin,
    image:
      avatar && avatar !== DEFAULT_AVATAR
        ? shareImage(avatar, origin, {
            alt: name,
            shape: "square",
            fallbackRoute: `/api/share-image/avatar/${encodeURIComponent(user.lbpayId)}`,
          })
        : null,
  });
}

export default function PayHandleLayout({ children }: Props) {
  return children;
}
