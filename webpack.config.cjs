const path = require("path");

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: "./src/index.js",
  experiments: { outputModule: true },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "loco-core.mjs",
    library: { type: "module" },
    clean: true,
  },
};
