import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const lessons = path.join(root, "src/experiments");

export function validateId(id) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`实验 ID 无效：${id}`);
  return id;
}
export async function select(id) {
  const entries = await readdir(lessons, { withFileTypes: true });
  const ids = id
    ? [id]
    : entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
  for (const name of ids) {
    validateId(name);
    await access(path.join(lessons, name, "Experiment.tsx"));
  }
  return ids;
}
