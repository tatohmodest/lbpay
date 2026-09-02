export function sanitizeSupportBody(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

export function supportBodyIssue(body: string) {
  if (body.length < 2) return "Write a message.";
  if (body.length > 2000) return "Keep the message under 2000 characters.";
  return "";
}

export function supportPreview(body: string, max = 96) {
  const text = sanitizeSupportBody(body);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}...`;
}

export function unreadSupportCount(
  messages: Array<{ author: "user" | "admin"; createdAt: string }>,
  lastReadAt: string | undefined,
  from: "user" | "admin",
) {
  const since = lastReadAt ? Date.parse(lastReadAt) : 0;
  return messages.filter((item) => item.author === from && Date.parse(item.createdAt) > since).length;
}
