const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtensionReloader = require("./scripts/ext-reloader");

const isDev = process.env.NODE_ENV !== "production";

// パス設定
const ROOT = __dirname; // プロジェクトルート
const SRC = path.resolve(ROOT, "src"); // srcフォルダ
const PUBLIC = path.resolve(ROOT, "public"); // 静的ファイル
const DIST = path.resolve(ROOT, "dist"); // 出力先

module.exports = {
  mode: isDev ? "development" : "production",
  devtool: isDev ? "inline-source-map" : false,
  context: SRC,
  entry: {
    background: isDev ? path.join(SRC, "background.dev.ts") : path.join(SRC, "background.ts"),
    content: path.join(SRC, "content.ts"),
    popup: path.join(SRC, "popup", "popup.ts")
  },
  output: {
    path: DIST,
    filename: "[name].js",
    publicPath: "",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    modules: [SRC, "node_modules"]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]"
        }
      }
    ]
  },
  plugins: (() => {
    const plugins = [
      new CopyWebpackPlugin({
        patterns: [
          // public の静的ファイルをコピー（manifest.dev.json / manifest.prod.json は除外）
          {
            from: PUBLIC,
            to: "./",
            globOptions: {
              ignore: ["**/manifest.dev.json", "**/manifest.prod.json"]
            }
          },
          // 適切な manifest を manifest.json として出力
          {
            from: path.join(PUBLIC, `manifest.${isDev ? "dev" : "prod"}.json`),
            to: "manifest.json"
          }
        ]
      })
    ];
    if (isDev) {
      plugins.unshift(new ExtensionReloader());
    }
    return plugins;
  })(),
  cache: {
    type: "filesystem"
  },
  performance: {
    hints: isDev ? false : "warning"
  },
  stats: isDev ? "minimal" : "normal"
};
