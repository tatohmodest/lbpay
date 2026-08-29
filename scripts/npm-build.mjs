import { spawnSync } from "node:child_process";

const workersCI = process.env.WORKERS_CI === "1";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

if (workersCI) {
  run("bash", ["scripts/cf-build.sh"]);
}

run("npx", ["next", "build"]);
