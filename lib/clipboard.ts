export async function copyText(value: string) {
  const text = value.trim();
  if (!text) throw new Error("Nothing to copy");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  document.body.removeChild(field);
}

export function lbpayIdText(handle: string) {
  const id = handle.replace(/^@/, "").trim();
  return id ? `@${id}` : "";
}
