import path from "node:path";
import mdx from "@mdx-js/rollup";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { lessons, root, validateId } from "./scripts/experiments.mjs";

export function config(id) {
  validateId(id);
  const folder = path.join(lessons, id);
  return {
    root,
    define: { __EXPERIMENT_ID__: JSON.stringify(id) },
    base: "./",
    publicDir: false,
    resolve: {
      alias: { "@experiment": path.join(folder, "Experiment.tsx"), "@": path.join(root, "src") },
    },
    plugins: [
      { enforce: "pre", ...mdx() },
      react(),
      tailwind(),
      viteSingleFile(),
      {
        name: "experiment-boundaries",
        enforce: "pre",
        async resolveId(source, importer, options) {
          if (!importer?.startsWith(path.join(root, "src") + path.sep)) return;
          const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
          if (!resolved?.id.startsWith(lessons + path.sep)) return resolved;
          if (
            !resolved.id.startsWith(folder + path.sep) ||
            importer.startsWith(path.join(root, "src/shared") + path.sep)
          ) {
            this.error(`实验依赖越界：${importer} → ${resolved.id}`);
          }
          return resolved;
        },
      },
      {
        name: "offline-policy",
        apply: "build",
        transformIndexHtml(html) {
          const policy =
            "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; worker-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none'";
          return html.replace(
            "<!-- offline-policy -->",
            `<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
          );
        },
      },
    ],
    build: {
      target: "es2022",
      outDir: path.join(root, "dist", id),
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1600,
    },
  };
}
export default config(process.env.ML_EXPERIMENT || "neuron");
