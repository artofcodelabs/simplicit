import { start } from "index";
import { Component } from "index";

describe("start", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("component class initialization", () => {
    it("initializes for every matching element and sets element before connect", () => {
      document.body.innerHTML = `
        <div data-component="hello"></div>
        <div data-component="hello"></div>
        <div data-component="display"></div>
      `;

      const seen = [];
      class Hello extends Component {
        static name = "hello";
        connect() {
          expect(this.element).toBeInstanceOf(HTMLElement);
          expect(this.element.getAttribute("data-component")).toBe("hello");
          seen.push(this.element);
        }
      }

      const result = start({ root: document, components: [Hello] });
      expect(Array.isArray(result)).toBe(true);
      expect(seen).toHaveLength(2);
      const expected = Array.from(
        document.querySelectorAll('[data-component="hello"]'),
      );
      expect(new Set(seen)).toEqual(new Set(expected));
    });

    it("respects provided element root when initializing components", () => {
      document.body.innerHTML = `
        <div id="a">
          <div data-component="hello"></div>
        </div>
        <div id="b">
          <div data-component="hello"></div>
        </div>
      `;

      const seen = [];
      class Hello extends Component {
        static name = "hello";
        connect() {
          seen.push(this.element);
        }
      }

      const rootA = document.getElementById("a");
      start({ root: rootA, components: [Hello] });
      expect(seen).toHaveLength(1);
      expect(rootA.contains(seen[0])).toBe(true);
    });

    it("warns when DOM has data-component without a provided class", () => {
      document.body.innerHTML = `
        <div data-component="display"></div>
      `;
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      start({ components: [] });
      expect(warnSpy).toHaveBeenCalled();
      const message = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(message).toMatch(/data-component="display"/);
      warnSpy.mockRestore();
    });

    it("assigns componentId and mirrors it to data-component-id on the element", () => {
      document.body.innerHTML = `
        <div data-component="hello"></div>
        <div data-component="hello"></div>
      `;

      const seen = [];
      class Hello extends Component {
        static name = "hello";
        connect() {
          seen.push({
            id: this.componentId,
            attr: this.element.getAttribute("data-component-id"),
          });
        }
      }

      start({ root: document, components: [Hello] });

      expect(seen).toHaveLength(2);
      for (const { id, attr } of seen) {
        expect(id).toBeDefined();
        expect(attr).toBeDefined();
        expect(id).toEqual(attr);
        expect(id).toMatch(/^\d+$/);
      }
      // ensure uniqueness across multiple instances
      const unique = new Set(seen.map((s) => s.id));
      expect(unique.size).toBe(seen.length);

      // also verify all hello elements have the attribute set
      const allHelloEls = Array.from(
        document.querySelectorAll('[data-component="hello"]'),
      );
      for (const el of allHelloEls) {
        expect(el.getAttribute("data-component-id")).toMatch(/^\d+$/);
      }
    });
  });

  it("returns empty array when no components present", () => {
    const result = start();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("collects a single root component", () => {
    document.body.innerHTML = `
      <div data-component="hello"></div>
    `;
    const result = start();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("hello");
    expect(result[0].children).toEqual([]);
    expect(result[0].element).toBeInstanceOf(HTMLElement);
  });

  it("builds nested components tree", () => {
    document.body.innerHTML = `
      <div data-component="parent">
        <div data-component="child-a"></div>
        <div>
          <section data-component="child-b">
            <span data-component="grandchild"></span>
          </section>
        </div>
      </div>
    `;
    const result = start({ root: document });
    expect(result).toHaveLength(1);
    const parent = result[0];
    expect(parent.name).toBe("parent");
    expect(parent.children.map((c) => c.name)).toEqual(["child-a", "child-b"]);
    const childB = parent.children[1];
    expect(childB.children).toHaveLength(1);
    expect(childB.children[0].name).toBe("grandchild");
    // parent references
    expect(parent.parent).toBe(null);
    expect(parent.children[0].parent).toBe(parent);
    expect(childB.parent).toBe(parent);
    expect(childB.children[0].parent).toBe(childB);
  });

  it("is idempotent across multiple runs (no duplicate roots)", () => {
    document.body.innerHTML = `
      <div data-component="parent">
        <div data-component="child"></div>
      </div>
    `;
    const first = start({ root: document });
    const second = start({ root: document });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(second[0].children).toHaveLength(1);
    // Independence: modifying one result should not affect the other
    first[0].children.push({
      name: "x",
      children: [],
      element: document.createElement("div"),
      parent: null,
    });
    expect(first[0].children).toHaveLength(2);
    expect(second[0].children).toHaveLength(1);
  });

  it("reflects DOM changes between calls", () => {
    document.body.innerHTML = `
      <div data-component="parent"></div>
    `;
    const before = start({ root: document });
    expect(before[0].children).toHaveLength(0);
    const parent = document.querySelector('[data-component="parent"]');
    const child = document.createElement("div");
    child.setAttribute("data-component", "child");
    parent.appendChild(child);
    const after = start({ root: document });
    expect(after[0].children.map((c) => c.name)).toEqual(["child"]);
  });

  it("scopes search to provided element root", () => {
    document.body.innerHTML = `
      <div id="a" data-component="A">
        <div data-component="A1"></div>
      </div>
      <div id="b" data-component="B">
        <div data-component="B1"></div>
      </div>
    `;
    const rootA = document.getElementById("a");
    const resultA = start({ root: rootA });
    expect(resultA).toHaveLength(1);
    expect(resultA[0].name).toBe("A");
    expect(resultA[0].children.map((c) => c.name)).toEqual(["A1"]);

    const rootB = document.getElementById("b");
    const resultB = start({ root: rootB });
    expect(resultB).toHaveLength(1);
    expect(resultB[0].name).toBe("B");
    expect(resultB[0].children.map((c) => c.name)).toEqual(["B1"]);
  });

  it("includes the root element itself if it has data-component", () => {
    const root = document.createElement("div");
    root.setAttribute("data-component", "root");
    root.innerHTML = `
      <div data-component="child"></div>
    `;
    const result = start({ root });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("root");
    expect(result[0].children.map((c) => c.name)).toEqual(["child"]);
  });
});
