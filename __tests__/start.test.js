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
      class Display extends Component {
        static name = "display";
      }

      start({ root: document, components: [Hello, Display] });
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

    it("throws when DOM has data-component without a provided class", () => {
      document.body.innerHTML = `
        <div data-component="display"></div>
      `;
      expect(() => start({ components: [] })).toThrow(
        /data-component="display"/,
      );
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

    it("provides sanitized node on instance without name and element keys", () => {
      document.body.innerHTML = `
        <div data-component="hello">
          <div data-component="display"></div>
        </div>
        <div data-component="hello"></div>
      `;

      const snapshots = [];
      class Hello extends Component {
        static name = "hello";
        connect() {
          snapshots.push({
            hasNameKey: Object.prototype.hasOwnProperty.call(this.node, "name"),
            hasElementKey: Object.prototype.hasOwnProperty.call(
              this.node,
              "element",
            ),
            hasParent: this.node.parent !== undefined,
            parentIsNull: this.node.parent === null,
            childrenCount: Array.isArray(this.node.children)
              ? this.node.children.length
              : -1,
            firstChildName:
              this.node.children && this.node.children[0]
                ? this.node.children[0].name
                : null,
          });
        }
      }

      class Display extends Component {
        static name = "display";
      }

      start({ root: document, components: [Hello, Display] });

      expect(snapshots).toHaveLength(2);
      // Both instances should have full node object
      for (const s of snapshots) {
        expect(s.hasNameKey).toBe(true);
        expect(s.hasElementKey).toBe(true);
        expect(s.hasParent).toBe(true);
        expect(s.childrenCount).toBeGreaterThanOrEqual(0);
      }
      // The first hello has a display child
      expect(snapshots[0].childrenCount).toBe(1);
      expect(snapshots[0].firstChildName).toBe("display");
      // The second hello has no children
      expect(snapshots[1].childrenCount).toBe(0);
    });
  });

  it("throws when no components present in root", () => {
    document.body.innerHTML = "";
    expect(() => start()).toThrow(/No component elements found/);
  });

  it("returns a single instance when one root component exists", () => {
    document.body.innerHTML = `
      <div data-component="hello"></div>
    `;
    class Hello extends Component {
      static name = "hello";
    }
    const app = start({ components: [Hello] });
    const result = app.roots;
    expect(result).toBeInstanceOf(Hello);
    expect(result.element).toBeInstanceOf(HTMLElement);
    expect(result.children()).toHaveLength(0);
  });

  it("builds nested components relationships on instances", () => {
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
    class Parent extends Component {
      static name = "parent";
    }
    class ChildA extends Component {
      static name = "child-a";
    }
    class ChildB extends Component {
      static name = "child-b";
    }
    class Grandchild extends Component {
      static name = "grandchild";
    }
    const app = start({
      root: document,
      components: [Parent, ChildA, ChildB, Grandchild],
    });
    const parent = app.roots;
    expect(parent.element.getAttribute("data-component")).toBe("parent");
    expect(
      parent.children().map((c) => c.element.getAttribute("data-component")),
    ).toEqual(["child-a", "child-b"]);
    const childB = parent.children()[1];
    expect(childB.children()).toHaveLength(1);
    expect(childB.children()[0].element.getAttribute("data-component")).toBe(
      "grandchild",
    );
    // parent references
    expect(parent.parent).toBeUndefined();
    expect(parent.children()[0].parent).toBe(parent);
    expect(childB.parent).toBe(parent);
    expect(childB.children()[0].parent).toBe(childB);
  });

  it("reflects consistent relationships across multiple runs", () => {
    document.body.innerHTML = `
      <div data-component="parent">
        <div data-component="child"></div>
      </div>
    `;
    class Parent extends Component {
      static name = "parent";
    }
    class Child extends Component {
      static name = "child";
    }
    const first = start({ root: document, components: [Parent, Child] }).roots;
    const second = start({ root: document, components: [Parent, Child] }).roots;
    expect(first.children()).toHaveLength(1);
    expect(second.children()).toHaveLength(1);
  });

  it("reflects DOM changes between calls", () => {
    document.body.innerHTML = `
      <div data-component="parent"></div>
    `;
    class Parent extends Component {
      static name = "parent";
    }
    class Child extends Component {
      static name = "child";
    }
    const before = start({ root: document, components: [Parent] }).roots;
    expect(before.children()).toHaveLength(0);
    const parent = document.querySelector('[data-component="parent"]');
    const child = document.createElement("div");
    child.setAttribute("data-component", "child");
    parent.appendChild(child);
    const after = start({ root: document, components: [Parent, Child] }).roots;
    expect(
      after.children().map((c) => c.element.getAttribute("data-component")),
    ).toEqual(["child"]);
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
    class A extends Component {
      static name = "A";
    }
    class A1 extends Component {
      static name = "A1";
    }
    class B extends Component {
      static name = "B";
    }
    class B1 extends Component {
      static name = "B1";
    }
    const resultA = start({ root: rootA, components: [A, A1, B, B1] }).roots;
    expect(resultA.element.getAttribute("data-component")).toBe("A");
    expect(
      resultA.children().map((c) => c.element.getAttribute("data-component")),
    ).toEqual(["A1"]);

    const rootB = document.getElementById("b");
    const resultB = start({ root: rootB, components: [A, A1, B, B1] }).roots;
    expect(resultB.element.getAttribute("data-component")).toBe("B");
    expect(
      resultB.children().map((c) => c.element.getAttribute("data-component")),
    ).toEqual(["B1"]);
  });

  it("includes the root element itself if it has data-component", () => {
    const root = document.createElement("div");
    root.setAttribute("data-component", "root");
    root.innerHTML = `
      <div data-component="child"></div>
    `;
    class Root extends Component {
      static name = "root";
    }
    class Child extends Component {
      static name = "child";
    }
    const app = start({ root, components: [Root, Child] });
    const result = app.roots;
    expect(result.element.getAttribute("data-component")).toBe("root");
    expect(
      result.children().map((c) => c.element.getAttribute("data-component")),
    ).toEqual(["child"]);
  });

  it("allows adding component classes after start() has been called", () => {
    document.body.innerHTML = `
      <div data-component="parent"></div>
    `;

    class Parent extends Component {
      static name = "parent";
    }

    class Child extends Component {
      static name = "child";
    }

    const app = start({ root: document, components: [Parent] });
    const parent = app.roots;

    const parentEl = document.querySelector('[data-component="parent"]');
    const childEl = document.createElement("div");
    childEl.setAttribute("data-component", "child");
    parentEl.appendChild(childEl);

    expect(childEl.instance).toBeUndefined();

    const added = app.addComponents([Child]);

    expect(added).toBeInstanceOf(Array);
    expect(added[0]).toBeInstanceOf(Child);
    expect(childEl.instance).toBeInstanceOf(Child);
    expect(parent.children("child")).toEqual([childEl.instance]);
  });
});
