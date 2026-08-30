import type { Plugin } from "vite";
import { build } from "vite";
import { resolve } from "node:path";

/**
 * Content script を IIFE 形式で単独バンドルするプラグイン．
 * Chrome の content scripts は ES module が使えないため，すべての依存を内包する必要がある．
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
