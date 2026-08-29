import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const MINIMAL_WASM = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const STUB_MARKER = "/* lbpay-og-stub */";
const OG_STUB = `${STUB_MARKER}
export class ImageResponse extends Response {
  constructor() {
    throw new Error("OG image generation is disabled to keep the Worker under the 3 MiB free-plan limit.");
  }
}
`;

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

function rewriteWasmImports(file) {
  if (!/\.(mjs|js|cjs)$/.test(file)) return;
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return;
  }
  const next = source.replace(
    /import\s+(\w+)\s+from\s+["'][^"']+\.wasm(?:\?module)?["'];?/g,
    "const $1 = new Uint8Array();",
  );
  if (next !== source) writeFileSync(file, next);
}

const ogDir = path.join(root, "node_modules/next/dist/compiled/@vercel/og");
for (const name of ["index.edge.js", "index.node.js"]) {
  const file = path.join(ogDir, name);
  try {
    const current = readFileSync(file, "utf8");
    if (!current.startsWith(STUB_MARKER)) writeFileSync(file, OG_STUB);
  } catch {
    /* package not installed */
  }
}

const targets = [path.join(root, ".open-next"), ogDir];

for (const target of targets) {
  for (const file of walk(target)) {
    if (file.endsWith(".wasm") && /resvg|yoga|@vercel\/og/i.test(file)) {
      writeFileSync(file, MINIMAL_WASM);
    }
    if (target.endsWith(".open-next")) rewriteWasmImports(file);
  }
}
