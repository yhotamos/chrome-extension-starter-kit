import type { Plugin } from "vite";
import { WebSocketServer, type WebSocket } from "ws";

/** ビルド完了後に WebSocket 経由で拡張機能へ "reload" を送信する Vite プラグイン */
export function extensionReloaderPlugin(port = 6571): Plugin {
  let wss: WebSocketServer | null = null;
  let watchMode = false;

  const sendReload = () => {
    for (const client of (wss?.clients ?? []) as Set<WebSocket>) {
      try {
        if (client.readyState === 1) client.send("reload");
      } catch {
        // 個々のクライアント送信エラーは無視する。
      }
    }
  };

  const cleanup = () => {
    const server = wss;
    wss = null;
    server?.close();
  };

  return {
    name: "extension-reloader",
    apply: "build",

    buildStart() {
      watchMode = this.meta.watchMode;
      if (wss) return;

      try {
        wss = new WebSocketServer({ port });
        wss.on("listening", () => {
          console.log(`[extension-reloader] WebSocket server listening on port ${port}`);
        });
        wss.on("error", (err: NodeJS.ErrnoException) => {
          console.warn("[extension-reloader] error:", err.code ?? err);
          if (err.code === "EADDRINUSE") cleanup();
        });

        process.once("exit", cleanup);
        process.once("SIGINT", () => {
          cleanup();
          process.exit();
        });
        process.once("SIGTERM", () => {
          cleanup();
          process.exit();
        });
      } catch (err: unknown) {
        console.warn(
          "[extension-reloader] WebSocket サーバの作成に失敗しました:",
          (err as NodeJS.ErrnoException)?.code ?? err,
        );
        cleanup();
      }
    },

    writeBundle: {
      sequential: true,
      handler: sendReload,
    },

    closeWatcher: cleanup,

    closeBundle() {
      if (!watchMode) cleanup();
    },
  };
}
