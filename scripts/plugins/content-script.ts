import type { Plugin } from "vite";
import { build } from "vite";
import { resolve } from "node:path";

/**
 * content script を依存すべてインライン済みの IIFE としてビルドする Vite プラグイン。
 * Chrome の content scripts は ES module の import が使えないため、
 * メインビルドのチャンク分割（logger.js 等）とは分離して単独バンドルにする。
 */
export function contentScriptPlugin(isDev: boolean, root: string): Plugin {
  let building = false;

  return {
    name: "content-script-iife",
    apply: "build",
    async closeBundle() {
      if (building) return;
      building = true;
      try {
        await build({
          configFile: false,
          logLevel: "warn",
          publicDir: false,
          define: { "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production") },
          build: {
            outDir: resolve(root, "dist"),
            emptyOutDir: false,
            sourcemap: isDev ? "inline" : false,
            minify: !isDev,
            rollupOptions: {
              input: resolve(root, "src/content/index.ts"),
              output: { format: "iife", entryFileNames: "content.js" },
            },
          },
        });
      } finally {
        building = false;
      }
    },
  };
}
