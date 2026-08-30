import type { Plugin } from "vite";
import { WebSocketServer, type WebSocket } from "ws";

/** ビルド完了後に WebSocket 経由で拡張機能へ "reload" を送信する Vite プラグイン */
export function extensionReloaderPlugin(port = 6571): Plugin {
  let wss: WebSocketServer | null = null;

  return {
    name: "extension-reloader",
    apply: "build",
    buildStart() {
      if (wss) return;
      try {
        wss = new WebSocketServer({ port });
        console.log(`[extension-reloader] WebSocket server listening on port ${port}`);
        wss.on("error", (err: NodeJS.ErrnoException) => {
          console.warn("[extension-reloader] error:", err.code ?? err);
        });
        const cleanup = () => { wss?.close(); wss = null; };
        process.on("exit", cleanup);
        process.on("SIGINT", () => { cleanup(); process.exit(); });
        process.on("SIGTERM", () => { cleanup(); process.exit(); });
      } catch (err: unknown) {
        console.warn("[extension-reloader] WebSocket サーバの作成に失敗しました:", (err as NodeJS.ErrnoException)?.code ?? err);
      }
    },
    closeBundle() {
      for (const client of (wss?.clients ?? []) as Set<WebSocket>) {
        try { if (client.readyState === 1) client.send("reload"); } catch { /* ignore */ }
      }
    },
  };
}
