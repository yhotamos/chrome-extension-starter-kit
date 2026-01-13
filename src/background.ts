import { reloadTargetTabs } from "./utils/reload-tabs";
import { reloadExtension } from "../scripts/reload";

// 開発用のターゲットURLパターン
const targetUrls = ["https://www.google.com/*"];

/** 開発環境の場合，拡張機能をリロード */
function developExtension(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("開発環境：", process.env.NODE_ENV);
    console.log("ターゲットタブのリロードを開始します", targetUrls);
    reloadExtension();
    reloadTargetTabs(targetUrls);
  }
}

/**
 * Background Script を初期化
 */
function initialize(): void {
  developExtension();
}

initialize();