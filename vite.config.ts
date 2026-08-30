import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { markdownPlugin } from "./scripts/vite-plugin-markdown";
import { extensionReloaderPlugin } from "./scripts/vite-plugin-extension-reloader";
import { contentScriptPlugin } from "./scripts/vite-plugin-content-script";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    // Vite のデフォルト public ディレクトリを無効化（viteStaticCopy で管理）
    publicDir: false,

    define: {
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: isDev ? "inline" : false,
      minify: isDev ? false : "esbuild",
      rollupOptions: {
        input: {
          background: isDev ? resolve(__dirname, "src/background/dev.ts") : resolve(__dirname, "src/background/index.ts"),
          popup: resolve(__dirname, "src/popup/index.ts"),
          // content は content スクリプト用プラグインが IIFE として別途ビルド
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? assetInfo.name ?? "unknown";
            const ext = name.split(".").pop() ?? "";
            if (/png|jpe?g|gif|svg|webp/i.test(ext)) {
              return "assets/[name][extname]";
            }
            return "[name][extname]";
          },
        },
      },
    },

    resolve: {
      alias: {
        src: resolve(__dirname, "src"),
      },
    },

    plugins: [
      markdownPlugin(),
      viteStaticCopy({
        targets: [
          { src: "public/popup.html", dest: "." },
          { src: "public/manifest.meta.json", dest: "." },
          { src: "public/icons", dest: "." },
          {
            src: `public/manifest.${isDev ? "dev" : "prod"}.json`,
            dest: ".",
            rename: "manifest.json",
          },
        ],
      }),

      ...(isDev ? [extensionReloaderPlugin()] : []),

      // content script を自己完結 IIFE としてビルド（logger.js 等の外部 import を排除）
      contentScriptPlugin(isDev),
    ],
  };
});
