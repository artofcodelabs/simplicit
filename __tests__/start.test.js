import { start } from "index";

describe("start", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
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
    const result = start();
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
    const first = start();
    const second = start();
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
    const before = start();
    expect(before[0].children).toHaveLength(0);
    const parent = document.querySelector('[data-component="parent"]');
    const child = document.createElement("div");
    child.setAttribute("data-component", "child");
    parent.appendChild(child);
    const after = start();
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
    const resultA = start(rootA);
    expect(resultA).toHaveLength(1);
    expect(resultA[0].name).toBe("A");
    expect(resultA[0].children.map((c) => c.name)).toEqual(["A1"]);

    const rootB = document.getElementById("b");
    const resultB = start(rootB);
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
    const result = start(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("root");
    expect(result[0].children.map((c) => c.name)).toEqual(["child"]);
  });
});
