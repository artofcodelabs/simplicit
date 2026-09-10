import { start, Component, Model } from "index";

class Row extends Component {
  static name = "h-row";
  static template = ({ id, title }) =>
    `<li data-component="h-row" data-key="${id}">${title}</li>`;
}
class Thing extends Model {
  static name = "hthing";
  static components = [Row];
}
class Other extends Model {
  static name = "hother";
  static components = [];
}

const seed = (name, records, asOf) =>
  `<script type="application/json" data-model="${name}"${
    asOf == null ? "" : ` data-as-of="${asOf}"`
  }>${JSON.stringify(records)}</script>`;

// MutationObserver delivers on a microtask and reportHydration queues another,
// so a macrotask tick is what reliably drains both.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("onHydrate", () => {
  // Each test gets its own root: start() leaves a live MutationObserver, and
  // hydration removes the script it consumed, so observers from earlier tests
  // would race for it.
  let root;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    Thing.load([]);
    Other.load([]);
  });

  it("reports the snapshot's as-of once the records are loaded", async () => {
    const seen = [];
    root.innerHTML = seed(
      "hthing",
      [{ id: 1, title: "a" }],
      "2026-09-10T10:00:00.000000Z",
    );
    start({
      root,
      models: [Thing, Other],
      onHydrate: (asOf) => seen.push([asOf, Thing.loaded.length]),
    });
    await flush();

    expect(seen).toEqual([["2026-09-10T10:00:00.000000Z", 1]]);
  });

  it("reports once per page, with the oldest as-of of its snapshots", async () => {
    const seen = [];
    root.innerHTML =
      seed("hother", [], "2026-09-10T10:00:05.000000Z") +
      seed("hthing", [{ id: 1, title: "a" }], "2026-09-10T10:00:01.000000Z");
    start({
      root,
      models: [Thing, Other],
      onHydrate: (asOf) => seen.push(asOf),
    });
    await flush();

    expect(seen).toEqual(["2026-09-10T10:00:01.000000Z"]);
  });

  it("reports snapshots that arrive later, after a navigation", async () => {
    const seen = [];
    start({
      root,
      models: [Thing, Other],
      onHydrate: (asOf) => seen.push(asOf),
    });
    await flush();
    expect(seen).toEqual([]);

    root.innerHTML = seed(
      "hthing",
      [{ id: 2, title: "b" }],
      "2026-09-10T11:00:00.000000Z",
    );
    await flush();

    expect(seen).toEqual(["2026-09-10T11:00:00.000000Z"]);
    expect(Thing.loaded.map((t) => t.id)).toEqual([2]);
  });

  it("stays silent for a snapshot with no as-of", async () => {
    const seen = [];
    root.innerHTML = seed("hthing", [{ id: 1, title: "a" }]);
    start({
      root,
      models: [Thing, Other],
      onHydrate: (asOf) => seen.push(asOf),
    });
    await flush();

    expect(seen).toEqual([]);
    expect(Thing.loaded).toHaveLength(1);
  });
});
