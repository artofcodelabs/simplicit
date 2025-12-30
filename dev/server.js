import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";

import webpackConfig from "../webpack.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = "..";

const app = express();
const compiler = webpack(webpackConfig);

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  }),
);

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, `${rootPath}/dev/index.html`));
});

app.get("/stimulus", (_, res) => {
  res.sendFile(path.join(__dirname, `${rootPath}/dev/stimulus.html`));
});

app.get("/slideshow", (_, res) => {
  res.sendFile(path.join(__dirname, `${rootPath}/dev/slideshow.html`));
});

app.listen(4000, () => {
  console.log("Example app listening on port 4000!\n");
});
