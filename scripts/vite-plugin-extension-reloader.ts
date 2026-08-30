import type { Plugin } from "vite";
import { WebSocketServer, type WebSocket } from "ws";

/**
 * 開発ウォッチモード中にビルド完了後、WebSocket 経由で拡張機能へ
 * "reload" を送信し自動リロードを行う Vite プラグイン
 * （webpack の ext-reloader.js の代替）
 */
export function extensionReloaderPlugin(port = 6571): Plugin {
  let wss: WebSocketServer | null = null;

  return {
    name: "extension-reloader",
    apply: "build",
    buildStart() {
      if (wss) return; // watch 中の再ビルドでは再生成しない
      try {
        wss = new WebSocketServer({ port });
        console.log(`[extension-reloader] WebSocket server listening on port ${port}`);
        wss.on("error", (err: NodeJS.ErrnoException) => {
          console.warn("[extension-reloader] error:", err.code ?? err);
        });

        const cleanup = () => {
          if (!wss) return;
          wss.close();
          wss = null;
        };
        process.on("exit", cleanup);
        process.on("SIGINT", () => { cleanup(); process.exit(); });
        process.on("SIGTERM", () => { cleanup(); process.exit(); });
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException;
        console.warn(`[extension-reloader] WebSocket サーバの作成に失敗しました:`, e?.code ?? e);
      }
    },
    closeBundle() {
      if (!wss) return;
      for (const client of wss.clients as Set<WebSocket>) {
        try {
          if (client.readyState === 1 /* OPEN */) {
            client.send("reload");
          }
        } catch {
          // 個々のクライアントエラーは無視
        }
      }
    },
  };
}
