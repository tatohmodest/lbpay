/**
 * After a deploy, an open tab can ask for a script file the server no longer
 * has (or cannot read). Retrying in place never helps: only a fresh page load
 * picks up the new files. Reload once per minute at most so a broken server
 * cannot trap the browser in a reload loop.
 */
const KEY = "lbpay_chunk_reload_at";

export function isChunkError(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /ChunkLoadError|Loading chunk|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

/** Returns true when a reload was started. */
export function reloadOnceForChunk(error: unknown) {
  if (typeof window === "undefined" || !isChunkError(error)) return false;
  try {
    const last = Number(window.sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
