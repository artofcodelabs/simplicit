import { start, Component, Model } from "index";

describe("sanitizing without losing parser context", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a representation rooted at <tr> into a <tbody> container", () => {
    class Row extends Component {
      static name = "row";
      static template = ({ id, title }) =>
        `<tr data-component="row" data-key="${id}"><td class="title">${title}</td></tr>`;
    }
    class Item extends Model {
      static name = "item";
      static components = [Row];
    }
    document.body.innerHTML = `
      <table><tbody data-container-component="row"></tbody></table>
      <script type="application/json" data-model="item">[{"id":1,"title":"A"},{"id":2,"title":"B"}]</script>`;

    start({ root: document, models: [Item] });

    expect(
      Array.from(document.querySelectorAll("tbody tr td.title")).map(
        (el) => el.textContent,
      ),
    ).toEqual(["A", "B"]);
  });

  it("still strips scripts and event handlers from a rendered record", () => {
    class Row extends Component {
      static name = "evil-row";
      static template = ({ id, title }) =>
        `<tr data-component="evil-row" data-key="${id}" onclick="eviL()"><td>${title}</td></tr>`;
    }
    class Item extends Model {
      static name = "evil-item";
      static components = [Row];
    }
    document.body.innerHTML = `
      <table><tbody data-container-component="evil-row"></tbody></table>
      <script type="application/json" data-model="evil-item">[{"id":1,"title":"<img src=q onerror=eviL()>A"}]</script>`;

    start({ root: document, models: [Item] });

    const row = document.querySelector("tbody tr");
    expect(row.hasAttribute("onclick")).toBe(false);
    expect(row.querySelector("img").hasAttribute("onerror")).toBe(false);
  });

  it("sanitizes on update(), not only on first render", () => {
    class Widget extends Component {
      static name = "widget";
      static template = ({ label }) =>
        `<div data-component="widget">${label ?? ""}</div>`;
    }
    document.body.innerHTML = `<div data-component="widget"></div>`;

    const { roots } = start({ root: document, components: [Widget] });
    roots[0].update({ label: '<img src=q onerror="eviL()">hi' });

    const img = document.querySelector('[data-component="widget"] img');
    expect(img).not.toBeNull();
    expect(img.hasAttribute("onerror")).toBe(false);
  });
});
