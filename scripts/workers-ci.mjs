/** True when this process is a Cloudflare Workers Builds job. */
export function isWorkersCI(env = process.env) {
  return (
    env.WORKERS_CI === "1" ||
    env.WORKERS_CI === "true" ||
    Boolean(env.WORKERS_CI_COMMIT_SHA) ||
    Boolean(env.WORKERS_CI_BUILD_UUID)
  );
}
