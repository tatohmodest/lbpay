import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { requireActiveUser } from "@/lib/server/guard";
import {
  appendSupportMessage,
  findSupportThreadByUser,
  getSupportConversation,
  listAdminUserIds,
  markSupportEmailed,
  markSupportRead,
} from "@/lib/server/support";
import { sendSupportNotice } from "@/lib/server/mail";
import { bootstrapAdminEmails } from "@/lib/roles";
import { pushAccount } from "@/lib/server/push";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const thread = await findSupportThreadByUser(auth.user.id);
    if (!thread) {
      return NextResponse.json({ thread: null, messages: [], unread: 0 });
    }
    await markSupportRead(thread, "user");
    const conversation = await getSupportConversation(thread, "admin");
    return NextResponse.json({
      thread: conversation.thread,
      messages: conversation.messages,
      unread: 0,
    });
  } catch (error) {
    return catchRoute("support-get", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = await request.json().catch(() => ({}));
    const result = await appendSupportMessage({
      userId: auth.user.id,
      author: "user",
      authorId: auth.user.id,
      body: String(body.body || ""),
    });

    const href = `${SITE_URL}/admin/support/${result.thread.id}`;
    const mail = await sendSupportNotice({
      to: bootstrapAdminEmails(),
      title: `${auth.user.name} sent a chat message`,
      intro: `@${auth.user.lbpayId} (${auth.user.email}) wrote in Chat with us.`,
      body: result.message.body,
      href,
      cta: "Open this conversation",
      replyTo: auth.user.email,
    });
    await markSupportEmailed(result.message.id, mail.delivered);

    const admins = await listAdminUserIds();
    await Promise.all(
      admins.map((id) =>
        pushAccount(id, "Chat with us", `${auth.user.name} sent a message.`, `/admin/support/${result.thread.id}`),
      ),
    );

    const conversation = await getSupportConversation(result.thread, "admin");
    return NextResponse.json({
      ok: true,
      thread: conversation.thread,
      messages: conversation.messages,
      mailed: mail.delivered,
    });
  } catch (error) {
    if (error instanceof Error && /write a message|2000 characters/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return catchRoute("support-send", error);
  }
}
