import { spawnSync } from "node:child_process";
import { isWorkersCI } from "./workers-ci.mjs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

if (isWorkersCI()) {
  run("bash", ["scripts/cf-build.sh"]);
}

run("npx", ["next", "build"]);
