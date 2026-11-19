import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
import { config } from "../vite.config.mjs";
import { root, select } from "./experiments.mjs";

for (const id of await select(process.argv[2])) {
  await build({ ...config(id), configFile: false });
  const dir = path.join(root, "dist", id);
  const files = await readdir(dir);
  if (files.length !== 1 || files[0] !== "index.html")
    throw new Error(`${id} 生成了外置文件：${files.join(", ")}`);
  console.log(
    `${id} · ${((await stat(path.join(dir, "index.html"))).size / 1024).toFixed(1)} KiB · 单文件`,
  );
}
