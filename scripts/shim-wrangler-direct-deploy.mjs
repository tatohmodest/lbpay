import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const MARKER = "LBPAY_OPEN_NEXT_DEPLOY_SHIM";
const bin = path.join(process.cwd(), "node_modules/wrangler/bin/wrangler.js");

if (!existsSync(bin)) process.exit(0);

const source = readFileSync(bin, "utf8");
if (source.includes(MARKER)) process.exit(0);

const shebang = source.startsWith("#!") ? source.slice(0, source.indexOf("\n") + 1) : "";
const body = shebang ? source.slice(shebang.length) : source;

const shim = `${shebang}/* ${MARKER} */
// Workers Builds runs \`npx wrangler deploy\`. Wrangler 4 then calls
// \`opennextjs-cloudflare deploy\`, which starts a local Miniflare worker
// via getPlatformProxy before uploading. That extra step is not needed
// after \`opennextjs-cloudflare build\` and has been failing CI.
process.env.OPEN_NEXT_DEPLOY = process.env.OPEN_NEXT_DEPLOY || "true";
if (process.argv.includes("deploy")) {
  if (!process.argv.includes("--keep-vars")) process.argv.push("--keep-vars");
  if (!process.argv.includes("--config") && !process.argv.includes("-c")) {
    process.argv.push("--config", "wrangler.jsonc");
  }
}

`;

writeFileSync(bin, `${shim}${body}`);
console.log("wrangler deploy will upload .open-next directly (no OpenNext wrapper).");
