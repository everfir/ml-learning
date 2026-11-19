import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
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
async function contents(id) {
  const dir = path.join(scratch, "dist-pages", id);
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort();
  return Promise.all(files.map(async (name) => [name, await readFile(path.join(dir, name))]));
}
async function digest() {
  const hash = createHash("sha256");
  for (const [name, bytes] of await contents("neuron")) hash.update(name).update(bytes);
  return hash.digest("hex");
}
try {
  for (const file of [
    "scripts",
    "pages",
    "src",
    "templates",
    "package.json",
    "index.html",
    "vite.config.mjs",
  ]) {
    await cp(path.join(root, file), path.join(scratch, file), { recursive: true });
  }
  await symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "dir");
  run("scripts/build-pages.mjs", "neuron");
  const before = await digest();
  run("scripts/new.mjs", "isolation-probe");
  run("scripts/build-pages.mjs", "isolation-probe");
  const entry = path.join(scratch, "src/experiments/isolation-probe/Experiment.tsx");
  await writeFile(
    entry,
    `import {cpuRuntime} from "@/shared/ml/tensor";
 import "./style.css";
 export default function Probe(){return <button type="button" className="p-[83px]" onClick={()=>void cpuRuntime()}>TF_ISOLATION_PROBE</button>}`,
  );
  run("scripts/build-pages.mjs");
  const probe = await contents("isolation-probe");
  assert.ok(
    probe.some(([name, bytes]) => name.endsWith(".js") && bytes.includes("TF_ISOLATION_PROBE")),
  );
  assert.ok(probe.some(([name, bytes]) => name.endsWith(".css") && bytes.includes("83px")));
  assert.equal(await digest(), before);
  await writeFile(entry, 'export {default} from "../neuron/Experiment";');
  assert.throws(() => run("scripts/lint-boundaries.mjs"), /实验依赖越界/);
  assert.throws(() => run("scripts/build-pages.mjs", "isolation-probe"), /实验依赖越界/);
  console.log(
    `新增实验含 TF.js 和私有样式，神经元课程分包 SHA-256 保持 ${before}；越界导入已拦截。`,
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
