import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { markdownPlugin } from "./scripts/plugins/markdown";
import { extensionReloaderPlugin } from "./scripts/plugins/extension-reloader";
import { contentScriptPlugin } from "./scripts/plugins/content-script";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const bgEntry = isDev
    ? r("./src/background/dev.ts")
    : r("./src/background/index.ts");

  return {
    publicDir: false,

    define: {
      "process.env.NODE_ENV": JSON.stringify(
        isDev ? "development" : "production"
      ),
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: isDev,
      minify: isDev ? false : "esbuild",
      rollupOptions: {
        input: {
          background: bgEntry,
          popup: r("./src/popup/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: ({ name }) => {
            if (!name) return "[name][extname]";
            if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) {
              return "assets/[name][extname]";
            }
            return "[name][extname]";
          },
        },
      },
    },

    resolve: {
      alias: {
        src: r("./src"),
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

      contentScriptPlugin(isDev, fileURLToPath(new URL(".", import.meta.url))),
    ],
  };
});