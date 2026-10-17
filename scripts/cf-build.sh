#!/usr/bin/env bash
# Cloudflare Workers Builds / wrangler deploy entrypoint.
# `npm run build` stays `next build` on Vercel. Workers Builds injects
# WORKERS_CI=1 and often only runs `npm run build`, then `npx wrangler deploy`.
# Workers Builds does not use wrangler.jsonc [build] as its compile step, so
# this script must be reachable from both npm run build and wrangler deploy.
set -euo pipefail

node scripts/strip-og-wasm.mjs

if [[ ! -f .open-next/worker.js ]]; then
  npx opennextjs-cloudflare build
  node scripts/strip-og-wasm.mjs
fi

# Unused phone screenshots are not referenced by the app. Drop them from the
# Worker asset upload if a previous tree still copied them into public/.
rm -f .open-next/assets/Screenshot_*.png public/Screenshot_*.png

# wrangler 4's real `deploy` (not --dry-run) auto-calls OpenNext, which starts
# Miniflare before upload. After a successful OpenNext build, upload directly.
if [[ "${WORKERS_CI:-}" == "1" || "${WORKERS_CI:-}" == "true" || -n "${WORKERS_CI_COMMIT_SHA:-}" || -n "${WORKERS_CI_BUILD_UUID:-}" ]]; then
  node scripts/shim-wrangler-direct-deploy.mjs
fi
