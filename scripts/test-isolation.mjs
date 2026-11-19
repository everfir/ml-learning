import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { root } from "./experiments.mjs";

const scratch = await mkdtemp(path.join(os.tmpdir(), "ml-learning-isolation-"));
function run(script, ...args) {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: scratch,
    encoding: "utf8",
    stdio: "pipe",
  });
}
async function digest() {
  return createHash("sha256")
    .update(await readFile(path.join(scratch, "dist/neuron/index.html")))
    .digest("hex");
}
try {
  for (const file of [
    "scripts",
    "src",
    "templates",
    "package.json",
    "index.html",
    "vite.config.mjs",
  ]) {
    await cp(path.join(root, file), path.join(scratch, file), { recursive: true });
  }
  await symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "dir");
  run("scripts/build.mjs", "neuron");
  const before = await digest();
  run("scripts/new.mjs", "isolation-probe");
  run("scripts/build.mjs", "isolation-probe");
  const entry = path.join(scratch, "src/experiments/isolation-probe/Experiment.tsx");
  await writeFile(
    entry,
    `import {cpuRuntime} from "@/shared/ml/tensor";
 import "./style.css";
 export default function Probe(){return <button type="button" className="p-[83px]" onClick={()=>void cpuRuntime()}>TF_ISOLATION_PROBE</button>}`,
  );
  run("scripts/build.mjs");
  const probe = await readFile(path.join(scratch, "dist/isolation-probe/index.html"), "utf8");
  assert.ok(probe.includes("TF_ISOLATION_PROBE") && probe.includes("83px"));
  assert.equal(await digest(), before);
  await writeFile(entry, 'export {default} from "../neuron/Experiment";');
  assert.throws(() => run("scripts/lint-boundaries.mjs"), /实验依赖越界/);
  assert.throws(() => run("scripts/build.mjs", "isolation-probe"), /实验依赖越界/);
  console.log(`新增实验含 TF.js 和私有样式，首课 SHA-256 保持 ${before}；越界导入已拦截。`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
