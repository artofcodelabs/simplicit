import { start, Component, Model } from "index";

class Row extends Component {
  static name = "c-row";
  static template = ({ id, title }) =>
    `<li data-component="c-row" data-key="${id}">${title}</li>`;
}
class Tally extends Component {
  static name = "c-tally";
  static template = ({ records }) =>
    `<span data-component="c-tally">${records.length}</span>`;
}
// Aggregates a record *field*, so it must follow field changes too.
class Sum extends Component {
  static name = "c-sum";
  static template = ({ records }) =>
    `<b data-component="c-sum">${records.reduce((n, r) => n + (r.size ?? 0), 0)}</b>`;
}
// Row renders per record (it has data-key); Tally has none, so it is a readout
// over the collection. Both are declared the same way.
// Renders from connect(), before connectModel() — `records` must already be
// an array there, with no default in the destructuring.
class Early extends Component {
  static name = "c-early";
  static template = ({ records, label }) =>
    `<i data-component="c-early">${label}:${records.length}</i>`;

  connect() {
    this.update({ label: "n" });
  }
}
class Thing extends Model {
  static name = "thing";
  static components = [Row, Tally, Sum, Early];
}

describe("collection readouts", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Thing.load([]);
  });

  const tally = () =>
    document.querySelector('[data-component="c-tally"]').textContent;
  const sum = () =>
    document.querySelector('[data-component="c-sum"]').textContent;

  it("renders the collection size without being bound to a record", () => {
    document.body.innerHTML = `
      <span data-component="c-tally"></span>
      <ul data-container-component="c-row"></ul>
      <script type="application/json" data-model="thing">[{"id":1,"title":"A"}]</script>`;

    start({ root: document, models: [Thing] });

    expect(tally()).toBe("1");
  });

  it("follows the collection as records are added and removed", () => {
    document.body.innerHTML = `
      <span data-component="c-tally"></span>
      <ul data-container-component="c-row"></ul>
      <script type="application/json" data-model="thing">[{"id":1,"title":"A"}]</script>`;

    start({ root: document, models: [Thing] });

    Thing.add({ id: 2, title: "B" });
    expect(tally()).toBe("2");

    Thing.byId(1).del();
    expect(tally()).toBe("1");
  });

  it("re-renders when a record field changes, not just the shape", () => {
    document.body.innerHTML = `
      <b data-component="c-sum"></b>
      <ul data-container-component="c-row"></ul>
      <script type="application/json" data-model="thing">[{"id":1,"title":"A","size":2}]</script>`;

    start({ root: document, models: [Thing] });
    expect(sum()).toBe("2");

    Thing.byId(1).update({ size: 5 });
    expect(sum()).toBe("5");
  });

  it("gives a readout `records` even when it renders from connect()", () => {
    document.body.innerHTML = `
      <i data-component="c-early"></i>
      <script type="application/json" data-model="thing">[{"id":1,"title":"A"}]</script>`;

    start({ root: document, models: [Thing] });

    // "n:0" from connect() (pre-hydration render), then "n:1" from connectModel().
    expect(
      document.querySelector('[data-component="c-early"]').textContent,
    ).toBe("n:1");
  });

  it("unsubscribes when the component is disconnected", () => {
    document.body.innerHTML = `<span data-component="c-tally"></span>`;
    const { roots } = start({ root: document, models: [Thing] });
    const instance = roots[0];
    instance.disconnect();

    // No handler left, so a collection change must not re-render it.
    Thing.add({ id: 9, title: "Z" });
    expect(instance.element.textContent).toBe("0");
  });
});
