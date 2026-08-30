import type { Plugin } from "vite";
import { build } from "vite";
import { resolve } from "node:path";

/**
 * Content script を IIFE 形式で単独バンドルするプラグイン．
 * Chrome の content scripts は ES module が使えないため，すべての依存を内包する必要がある．
 */
export function contentScriptPlugin(isDev: boolean, root: string): Plugin {
  const contentEntry = resolve(root, "src/content/index.ts");
  const contentLogger = resolve(root, "src/utils/logger.ts");
  let building = false;

  return {
    name: "content-script-iife",
    apply: "build",

    buildStart() {
      // Content script は別の Vite build で生成するため、親の watch graph に明示的に追加する。
      this.addWatchFile(contentEntry);
      this.addWatchFile(contentLogger);
    },

    writeBundle: {
      sequential: true,
      async handler() {
        if (building) return;
        building = true;
        try {
          await build({
            configFile: false,
            logLevel: "warn",
            publicDir: false,
            define: {
              "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
            },
            resolve: {
              alias: { src: resolve(root, "src") },
            },
            build: {
              outDir: resolve(root, "dist"),
              emptyOutDir: false,
              sourcemap: isDev ? "inline" : false,
              minify: isDev ? false : undefined,
              rollupOptions: {
                input: contentEntry,
                output: { format: "iife", entryFileNames: "content.js" },
              },
            },
          });
        } finally {
          building = false;
        }
      },
    },
  };
}
