import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { lessons, root, validateId } from "./experiments.mjs";

const id = validateId(process.argv[2] ?? "");
const dir = path.join(lessons, id);
await mkdir(dir);
await cp(path.join(root, "templates/experiment"), dir, { recursive: true });
const entry = path.join(dir, "lesson.json");
await writeFile(entry, (await readFile(entry, "utf8")).replace("__ID__", id));
console.log(`已创建 ${dir}\n开发：pnpm dev ${id}\n线上构建：pnpm build ${id}`);
