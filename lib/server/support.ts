import { uid } from "@/lib/format";
import { isAdmin } from "@/lib/roles";
import { sanitizeSupportBody, supportBodyIssue, unreadSupportCount } from "@/lib/support";
import {
  findUserById,
  getDb,
  listUsers,
  publicUser,
  saveDb,
  type StoredSupportMessage,
  type StoredSupportThread,
  type SupportAuthor,
} from "@/lib/server/db";

export type PublicSupportMessage = {
  id: string;
  author: SupportAuthor;
  body: string;
  createdAt: string;
};

export type PublicSupportThread = {
  id: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  unread: number;
  lastMessage?: PublicSupportMessage | null;
  user?: ReturnType<typeof publicUser> | null;
};

function asPublicMessage(row: StoredSupportMessage): PublicSupportMessage {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.createdAt,
  };
}

export async function findSupportThreadByUser(userId: string) {
  const db = await getDb();
  return (db.supportThreads || []).find((item) => item.userId === userId) || null;
}

export async function findSupportThreadById(id: string) {
  const db = await getDb();
  return (db.supportThreads || []).find((item) => item.id === id) || null;
}

export async function listSupportMessages(threadId: string) {
  const db = await getDb();
  return (db.supportMessages || [])
    .filter((item) => item.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function supportUnreadForUser(userId: string) {
  const thread = await findSupportThreadByUser(userId);
  if (!thread) return 0;
  const messages = await listSupportMessages(thread.id);
  return unreadSupportCount(messages, thread.userLastReadAt, "admin");
}

export async function supportUnreadAdminCount() {
  const db = await getDb();
  let total = 0;
  for (const thread of db.supportThreads || []) {
    const messages = (db.supportMessages || []).filter((item) => item.threadId === thread.id);
    total += unreadSupportCount(messages, thread.adminLastReadAt, "user");
  }
  return total;
}

export async function listSupportThreadsForAdmin(): Promise<PublicSupportThread[]> {
  const db = await getDb();
  const users = await listUsers();
  const byUser = new Map(users.map((user) => [user.id, user]));
  const rows = [...(db.supportThreads || [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return Promise.all(
    rows.map(async (thread) => {
      const messages = await listSupportMessages(thread.id);
      const last = messages[messages.length - 1];
      const user = byUser.get(thread.userId);
      return {
        id: thread.id,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        unread: unreadSupportCount(messages, thread.adminLastReadAt, "user"),
        lastMessage: last ? asPublicMessage(last) : null,
        user: user ? publicUser(user) : null,
      };
    }),
  );
}

export async function markSupportRead(thread: StoredSupportThread, who: SupportAuthor) {
  const db = await getDb();
  const row = (db.supportThreads || []).find((item) => item.id === thread.id);
  if (!row) return thread;
  const now = new Date().toISOString();
  if (who === "user") row.userLastReadAt = now;
  else row.adminLastReadAt = now;
  await saveDb(db);
  return row;
}

export async function appendSupportMessage(input: {
  userId: string;
  author: SupportAuthor;
  authorId: string;
  body: string;
  threadId?: string;
}) {
  const body = sanitizeSupportBody(input.body);
  const issue = supportBodyIssue(body);
  if (issue) throw new Error(issue);

  const db = await getDb();
  const now = new Date().toISOString();
  let thread =
    (input.threadId
      ? (db.supportThreads || []).find((item) => item.id === input.threadId)
      : (db.supportThreads || []).find((item) => item.userId === input.userId)) || null;

  if (thread && thread.userId !== input.userId) {
    throw new Error("Conversation not found.");
  }

  if (!thread) {
    thread = {
      id: uid("sup"),
      userId: input.userId,
      status: "open",
      createdAt: now,
      updatedAt: now,
      userLastReadAt: input.author === "user" ? now : undefined,
      adminLastReadAt: input.author === "admin" ? now : undefined,
    };
    db.supportThreads = [...(db.supportThreads || []), thread];
  } else {
    thread.status = "open";
    thread.updatedAt = now;
    if (input.author === "user") thread.userLastReadAt = now;
    else thread.adminLastReadAt = now;
  }

  const message: StoredSupportMessage = {
    id: uid("smsg"),
    threadId: thread.id,
    author: input.author,
    authorId: input.authorId,
    body,
    createdAt: now,
  };
  db.supportMessages = [...(db.supportMessages || []), message];
  await saveDb(db);
  return { thread, message };
}

export async function markSupportEmailed(messageId: string, delivered: boolean) {
  const db = await getDb();
  const row = (db.supportMessages || []).find((item) => item.id === messageId);
  if (!row) return;
  row.emailedAt = delivered ? new Date().toISOString() : null;
  await saveDb(db);
}

export async function listAdminUserIds() {
  const users = await listUsers();
  return users.filter((user) => isAdmin(user)).map((user) => user.id);
}

export async function getSupportConversation(thread: StoredSupportThread, unreadFrom: SupportAuthor) {
  const messages = await listSupportMessages(thread.id);
  const user = await findUserById(thread.userId);
  return {
    thread: {
      id: thread.id,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      unread: unreadSupportCount(
        messages,
        unreadFrom === "admin" ? thread.adminLastReadAt : thread.userLastReadAt,
        unreadFrom,
      ),
      user: user ? publicUser(user) : null,
    },
    messages: messages.map(asPublicMessage),
  };
}
