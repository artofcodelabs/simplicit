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

app.use(express.json());

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  }),
);

let articles = [
  { id: 1, title: "Simplicit is tiny", body: "A modest framework." },
  { id: 2, title: "Models drive views", body: "One source of truth." },
];
let nextArticleId = 3;

app.get("/api/articles", (_, res) => res.json(articles));

app.post("/api/articles", (req, res) => {
  const { title, body } = req.body.article ?? {};
  const article = { id: nextArticleId++, title, body };
  articles.push(article);
  res.json({ success: true, id: article.id });
});

app.put("/api/articles/:id", (req, res) => {
  const article = articles.find((a) => String(a.id) === req.params.id);
  if (!article) return res.status(404).json({ success: false });
  Object.assign(article, req.body.article ?? {});
  res.json({ success: true });
});

app.delete("/api/articles/:id", (req, res) => {
  articles = articles.filter((a) => String(a.id) !== req.params.id);
  res.json({ success: true });
});

app.get("/loco-reactive.js", (_, res) => {
  res.type("js").sendFile(path.join(__dirname, "loco-reactive.js"));
});

// TODO: Requires ../loco-js-model next to this repo
app.get("/loco-model.js", (_, res) => {
  const file = path.resolve(
    __dirname,
    `${rootPath}/../loco-js-model/dist/loco-model.js`,
  );
  res.sendFile(file, (err) => {
    if (err)
      res
        .status(404)
        .type("js")
        .send(
          `throw new Error("loco-js-model build not found at ${file} — clone it next to this repo and run 'npm run build' there.");`,
        );
  });
});

app.get("/{:page}", (req, res) => {
  res.sendFile(path.join(__dirname, `${req.params.page || "index"}.html`));
});

app.listen(4000, () => {
  console.log("Example app listening on port 4000!\n");
});
