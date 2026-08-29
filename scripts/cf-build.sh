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
