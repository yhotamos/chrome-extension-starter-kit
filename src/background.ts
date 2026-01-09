import { reloadExtension } from "../scripts/reload";

/**
 * Background Script を初期化
 */
function initialize(): void {
  console.log("現在の環境：", process.env.NODE_ENV);

  if (process.env.NODE_ENV === "development") {
    reloadExtension();
  }
}

initialize();