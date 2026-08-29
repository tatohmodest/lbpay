import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({}),
  // OpenNext defaults to `npm run build`. Keep that script Vercel-safe
  // (`next build` unless WORKERS_CI=1) so this cannot recurse.
  buildCommand: "npx next build",
};
