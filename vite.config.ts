import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { markdownPlugin } from "./scripts/vite-plugin-markdown";
import { extensionReloaderPlugin } from "./scripts/vite-plugin-extension-reloader";

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
          // 開発時は dev.ts（オートリロード込み），本番は index.ts
          background: isDev ? resolve(__dirname, "src/background/dev.ts") : resolve(__dirname, "src/background/index.ts"),
          content: resolve(__dirname, "src/content/index.ts"),
          popup: resolve(__dirname, "src/popup/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          // CSS や画像のアセット名をフラットに出力（例: popup.css, assets/icon.png）
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? assetInfo.name ?? "asset";
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
        // tsconfig の baseUrl: "src" に対応するエイリアス
        src: resolve(__dirname, "src"),
      },
    },

    plugins: [
      markdownPlugin(),

      // 静的ファイルのコピー（CopyWebpackPlugin の代替）
      viteStaticCopy({
        targets: [
          { src: "public/popup.html", dest: "." },
          { src: "public/manifest.meta.json", dest: "." },
          { src: "public/icons", dest: "." },
          // 環境に応じた manifest を manifest.json としてコピー
          {
            src: `public/manifest.${isDev ? "dev" : "prod"}.json`,
            dest: ".",
            rename: "manifest.json",
          },
        ],
      }),

      // 開発時のみ拡張機能オートリロードを有効化
      ...(isDev ? [extensionReloaderPlugin()] : []),
    ],
  };
});
