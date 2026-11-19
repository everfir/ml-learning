// Check authored imports before bundling, including CSS processed by Tailwind.

import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import postcss from "postcss";
import ts from "typescript";
import { lessons, root } from "./experiments.mjs";

for await (const file of glob("src/**/*.{ts,tsx,css,mdx}")) {
  const contents = await readFile(file, "utf8");
  const from = path.resolve(file);
  const source = path.join(root, "src");
  const owner = from.startsWith(lessons + path.sep)
    ? from.slice(lessons.length + 1).split(path.sep)[0]
    : null;
  function check(specifier) {
    const to = specifier.startsWith("@/")
      ? path.resolve(source, specifier.slice(2))
      : path.resolve(path.dirname(from), specifier);
    if (
      (to.startsWith(lessons + path.sep) &&
        (!owner ||
          (to !== path.join(lessons, owner) &&
            !to.startsWith(path.join(lessons, owner) + path.sep)))) ||
      (specifier === "@experiment" && file !== "src/main.tsx")
    ) {
      throw new Error(`实验依赖越界：${file} → ${specifier}`);
    }
  }
  if (file.endsWith(".css")) {
    const targets = [];
    postcss.parse(contents, { from: file }).walkAtRules(/^(source|import)$/i, (rule) => {
      const target = rule.params.match(/^(?:url\()?["']([^"']+)["']/)?.[1];
      if (target) targets.push({ kind: rule.name, target });
    });
    for (const { kind, target } of targets) {
      check(target);
      if (kind !== "source") continue;
      const dir = owner ? path.join(lessons, owner) : path.join(source, "shared");
      const resolved = path.resolve(path.dirname(from), target);
      const isOwn = resolved === dir || resolved.startsWith(dir + path.sep);
      const sharedFile =
        resolved.startsWith(path.join(source, "shared") + path.sep) &&
        /\.[cm]?[jt]sx?$/.test(resolved) &&
        !/[*?{}[\]]/.test(resolved);
      if (!isOwn && !sharedFile) throw new Error(`样式扫描越界：${file} → ${target}`);
    }
  } else {
    const code = file.endsWith(".mdx") ? String(await compile(contents)) : contents;
    for (const item of ts.preProcessFile(code, true, true).importedFiles) check(item.fileName);
  }
}
