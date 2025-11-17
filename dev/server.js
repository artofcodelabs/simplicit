const path = require("path");
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");

const rootPath = "..";

const app = express();
const config = require(`${rootPath}/webpack.config.js`);
const compiler = webpack(config);

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
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
