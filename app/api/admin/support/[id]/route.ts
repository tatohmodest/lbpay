import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/guard";
import {
  appendSupportMessage,
  findSupportThreadById,
  getSupportConversation,
  markSupportEmailed,
  markSupportRead,
} from "@/lib/server/support";
import { sendSupportNotice } from "@/lib/server/mail";
import { findUserById } from "@/lib/server/db";
import { pushAccount } from "@/lib/server/push";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error!;
    const { id } = await params;
    const thread = await findSupportThreadById(id);
    if (!thread) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    await markSupportRead(thread, "admin");
    const conversation = await getSupportConversation(thread, "user");
    return NextResponse.json(conversation);
  } catch (error) {
    return catchRoute("admin-support-get", error);
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error!;
    const { id } = await params;
    const thread = await findSupportThreadById(id);
    if (!thread) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const result = await appendSupportMessage({
      userId: thread.userId,
      threadId: thread.id,
      author: "admin",
      authorId: auth.user.id,
      body: String(body.body || ""),
    });
    const user = await findUserById(thread.userId);
    if (user?.email) {
      const mail = await sendSupportNotice({
        to: user.email,
        title: "LBPay replied to your chat",
        intro: "The LBPay team replied to your message. You can continue the conversation in the app.",
        body: result.message.body,
        href: `${SITE_URL}/wallet/support`,
        cta: "Open Chat with us",
      });
      await markSupportEmailed(result.message.id, mail.delivered);
    }
    void pushAccount(thread.userId, "Chat with us", "LBPay replied to your message.", "/wallet/support");
    const conversation = await getSupportConversation(result.thread, "user");
    return NextResponse.json({ ok: true, ...conversation });
  } catch (error) {
    if (error instanceof Error && /write a message|2000 characters/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return catchRoute("admin-support-reply", error);
  }
}
