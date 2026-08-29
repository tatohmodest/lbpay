import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const MINIMAL_WASM = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

function walk(dir, files = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const targets = [path.join(root, ".open-next"), path.join(root, "node_modules/next/dist/compiled/@vercel/og")];

for (const target of targets) {
  for (const file of walk(target)) {
    if (file.endsWith(".wasm") && /resvg|yoga|@vercel\/og/i.test(file)) {
      writeFileSync(file, MINIMAL_WASM);
    }
  }
}

const middleware = path.join(root, ".open-next/middleware/handler.mjs");
try {
  const source = readFileSync(middleware, "utf8");
  const next = source.replace(
    /import\s+(\w+)\s+from\s+["'][^"']+\.wasm(?:\?module)?["'];?/g,
    "const $1 = new Uint8Array();",
  );
  if (next !== source) writeFileSync(middleware, next);
} catch {
  /* middleware bundle is optional when OpenNext has not run yet */
}
