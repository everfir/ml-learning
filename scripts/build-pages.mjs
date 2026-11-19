import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
import { getManifest } from "workbox-build";
import { config } from "../vite.config.mjs";
import { lessons, root, select } from "./experiments.mjs";

const site = path.join(root, "dist-pages");
const requested = process.argv[2];
const ids = await select(requested);
if (!requested) await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
const links = [];
for (const id of ids) {
  const { title, number } = JSON.parse(
    await readFile(path.join(lessons, id, "lesson.json"), "utf8"),
  );
  await build({ ...config(id, { pages: true }), configFile: false });
  const dir = path.join(site, id);
  const icons = [];
  for (const size of [192, 512]) {
    const src = `icon-${size}.png`;
    await copyFile(path.join(root, "pages", src), path.join(dir, src));
    icons.push({ src, sizes: `${size}x${size}`, type: "image/png" });
  }
  const manifest = {
    name: title,
    short_name: title,
    lang: "zh-CN",
    id: "./",
    start_url: "./",
    scope: "./",
    display: "standalone",
    theme_color: "#f6f7f8",
    background_color: "#f6f7f8",
    icons,
  };
  await writeFile(path.join(dir, "manifest.webmanifest"), JSON.stringify(manifest));
  const { manifestEntries, warnings } = await getManifest({
    globDirectory: dir,
    globPatterns: [
      "index.html",
      "importmap.json",
      "manifest.webmanifest",
      "icon-*.png",
      "assets/**/*",
    ],
    dontCacheBustURLsMatching: /^assets\/.+-[\w-]{8,}\.[\w.]+$/,
  });
  if (warnings.length) throw new Error(warnings.join("\n"));
  await build({
    configFile: false,
    publicDir: false,
    define: { "self.__WB_MANIFEST": JSON.stringify(manifestEntries) },
    build: {
      target: "es2022",
      outDir: dir,
      emptyOutDir: false,
      rolldownOptions: {
        input: path.join(root, "pages/lesson-sw.js"),
        output: { format: "iife", entryFileNames: "sw.js" },
      },
    },
  });
  const label = title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  links.push({
    order: number ?? Infinity,
    html: `<li><a href="./${id}/">${number ? `第 ${number} 课 · ` : ""}${label}</a></li>`,
  });
}
// A targeted build only updates its own lesson directory.
if (!requested) {
  const catalog = await readFile(path.join(root, "pages/index.html"), "utf8");
  await writeFile(
    path.join(site, "index.html"),
    catalog.replace(
      "<!-- lessons -->",
      links
        .sort((a, b) => a.order - b.order)
        .map((link) => link.html)
        .join("\n"),
    ),
  );
}
