import type { Plugin } from "vite";
import { build } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// ビルドの再帰呼び出しを防ぐフラグ
let _building = false;

/**
 * content script を依存をすべてインラインに含む自己完結 IIFE としてビルドするプラグイン。
 *
 * Chrome の content scripts は ES module の import 文を解釈できないため、
 * メインビルドの共有チャンク分割（logger.js など）の対象から外し、
 * 単独の IIFE バンドルとして dist/content.js を生成する。
 */
export function contentScriptPlugin(isDev: boolean): Plugin {
  return {
    name: "content-script-standalone",
    apply: "build",
    async closeBundle() {
      if (_building) return;
      _building = true;
      try {
        await build({
          configFile: false,
          logLevel: "warn",
          publicDir: false,
          define: {
            "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
          },
          build: {
            outDir: resolve(__dirname, "../dist"),
            emptyOutDir: false, // メインビルドの成果物を消さない
            sourcemap: isDev ? "inline" : false,
            minify: isDev ? false : "esbuild",
            rollupOptions: {
              input: resolve(__dirname, "../src/content/index.ts"),
              output: {
                format: "iife",
                entryFileNames: "content.js",
              },
            },
          },
        });
        console.log("[content-script] dist/content.js をスタンドアロンバンドルとして生成しました");
      } finally {
        _building = false;
      }
    },
  };
}
