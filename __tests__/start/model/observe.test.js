import { start, Component, Model } from "index";
import { waitFor } from "../../support";

class ArticleCard extends Component {
  static name = "article-card";
  static template = ({ id, title }) =>
    `<div data-component="article-card" data-key="${id}"><h4>${title}</h4></div>`;
}
class Article extends Model {
  static name = "article";
  static components = [ArticleCard];
}

const cards = () =>
  Array.from(
    document.querySelectorAll('[data-component="article-card"] h4'),
  ).map((el) => el.textContent);

const appendHTML = (html) => {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  const node = holder.firstElementChild;
  document.body.appendChild(node);
  return node;
};

describe("observeModels (streamed-in markup)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Article.load([]);
  });

  it("renders a container that appears after start()", async () => {
    document.body.innerHTML = `<script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>`;
    start({ root: document, models: [Article] });

    // Turbo swaps in a fragment carrying the container later.
    appendHTML(`<div data-container-component="article-card"></div>`);

    await waitFor(() => cards().length === 1);
    expect(cards()).toEqual(["A"]);
  });

  it("hydrates a data-model script that appears after start() (container first)", async () => {
    document.body.innerHTML = `<div data-container-component="article-card"></div>`;
    start({ root: document, models: [Article] });
    expect(cards()).toEqual([]); // no data yet

    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.model = "article";
    script.textContent = `[{"id":1,"title":"A"},{"id":2,"title":"B"}]`;
    document.body.appendChild(script);

    await waitFor(() => cards().length === 2);
    expect(cards()).toEqual(["A", "B"]);
  });

  it("replaces the collection when a new data-model script arrives (Turbo navigation)", async () => {
    document.body.innerHTML = `
      <div data-container-component="article-card"></div>
      <script type="application/json" data-model="article">[{"id":1,"title":"A"},{"id":2,"title":"B"}]</script>`;
    start({ root: document, models: [Article] });
    expect(cards()).toEqual(["A", "B"]);

    const next = document.createElement("script");
    next.type = "application/json";
    next.dataset.model = "article";
    next.textContent = `[{"id":3,"title":"C"}]`;
    document.body.appendChild(next);

    await waitFor(() => cards().length === 1);
    expect(cards()).toEqual(["C"]);
  });

  it("refreshes a re-appearing card to its live record (no re-hydration)", async () => {
    document.body.innerHTML = `<script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>`;
    start({ root: document, models: [Article] });

    // A live update (e.g. websocket) mutates the in-memory record.
    Article.byId(1).update({ title: "Live" });

    // Turbo restores a cached snapshot: a card with the OLD markup reappears.
    appendHTML(
      `<div data-component="article-card" data-key="1"><h4>A</h4></div>`,
    );

    // It re-binds and re-renders from memory — no stale JSON to re-hydrate from.
    await waitFor(() => cards().includes("Live"));
    expect(cards()).toEqual(["Live"]);
  });

  it("renders a create() into a container restored from a snapshot", async () => {
    document.body.innerHTML = `<script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>`;
    start({ root: document, models: [Article] });

    // Turbo restores the container with its cached card.
    appendHTML(
      `<div data-container-component="article-card"><div data-component="article-card" data-key="1"><h4>A</h4></div></div>`,
    );
    await waitFor(() => cards().length === 1);

    // Websocket create while sitting on the restored page — must still render.
    Article.add({ id: 2, title: "B" });

    await waitFor(() => cards().length === 2);
    expect(cards()).toEqual(["A", "B"]);
  });

  it("reconciles a restored container to records added while it was away", async () => {
    document.body.innerHTML = `<script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>`;
    start({ root: document, models: [Article] });

    // A record was created while this container was unmounted (another page).
    Article.add({ id: 2, title: "B" });

    // Now a stale snapshot (only card 1) is restored.
    appendHTML(
      `<div data-container-component="article-card"><div data-component="article-card" data-key="1"><h4>A</h4></div></div>`,
    );

    // On re-add it reconciles to the live collection.
    await waitFor(() => cards().length === 2);
    expect(cards()).toEqual(["A", "B"]);
  });

  it("warns (does not throw) for a late data-model script with no matching Model", async () => {
    document.body.innerHTML = "";
    start({ root: document, models: [Article] });

    const warnings = [];
    const original = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    try {
      const script = document.createElement("script");
      script.type = "application/json";
      script.dataset.model = "unknown";
      script.textContent = `[{"id":1}]`;
      document.body.appendChild(script); // must not throw (inside an observer)

      await waitFor(() => warnings.some((w) => /data-model="unknown"/.test(w)));
      expect(script.isConnected).toBe(true); // left untouched, not consumed
    } finally {
      console.warn = original;
    }
  });
});
