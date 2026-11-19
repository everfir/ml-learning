import { access, glob, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import headingIncrement from "remark-lint-heading-increment";
import uniqueHeadings from "remark-lint-no-duplicate-headings";
import references from "remark-lint-no-undefined-references";
import { sections } from "../src/shared/lesson-route.ts";

const anchorsByFile = new Map();
const links = [];
function lessonAnchors() {
  return (tree, file) => {
    const ids = new Set();
    anchorsByFile.set(path.resolve(file.path), ids);
    function inspect(node) {
      const attr = (name) => node.attributes?.find((a) => a.name === name)?.value;
      if (node.name === "Heading") {
        const id = attr("id");
        if (typeof id !== "string" || !/^[a-z][a-z0-9-]*$/.test(id))
          file.message("Heading 需要稳定的小写英文 id", node);
        else if (ids.has(id)) file.message(`重复的段落 id：${id}`, node);
        else ids.add(id);
      }
      if (node.name === "Jump")
        links.push({
          file: file.path,
          section: attr("section"),
          anchor: attr("anchor"),
          line: node.position?.start.line,
        });
      for (const child of node.children ?? []) inspect(child);
    }
    inspect(tree);
  };
}
for await (const dir of glob("{src/experiments/*,templates/experiment}")) {
  for (const section of sections) {
    const file = path.join(dir, `${section}.mdx`);
    await access(file).catch(() => {
      throw new Error(`缺少课程章节：${file}`);
    });
  }
}
for await (const file of glob("{src,templates}/**/*.mdx")) {
  const result = await compile(
    { path: file, value: await readFile(file, "utf8") },
    { remarkPlugins: [headingIncrement, uniqueHeadings, references, lessonAnchors] },
  );
  for (const message of result.messages) {
    console.error(`${file}:${message.line} ${message.reason}`);
    process.exitCode = 1;
  }
}
for (const { file, section, anchor, line } of links) {
  const ids = anchorsByFile.get(path.resolve(path.dirname(file), `${section}.mdx`));
  if (!sections.includes(section) || !ids || (anchor !== undefined && !ids.has(anchor))) {
    console.error(`${file}:${line} 找不到正文目标 ${section}/${anchor ?? ""}`);
    process.exitCode = 1;
  }
}
