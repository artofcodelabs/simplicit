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
  });
});
