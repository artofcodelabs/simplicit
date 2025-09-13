import { buildElementTree } from "../../src/start/scan";

describe("buildElementTree (scanning)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("scans under root and includes root when applicable", () => {
    document.body.innerHTML = `
      <div data-component="root">
        <div data-component="child"></div>
      </div>
    `;
    const root = document.querySelector('[data-component="root"]');
    const elementToNode = buildElementTree(root);
    const keys = Array.from(elementToNode.keys());
    expect(keys[0]).toBe(root);
    expect(keys.some((e) => e.getAttribute("data-component") === "child")).toBe(
      true,
    );
  });
});

describe("buildElementTree", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("builds a proper element tree with parent/children links", () => {
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
    const elementToNode = buildElementTree(document.body);
    const parentEl = document.querySelector('[data-component="parent"]');
    const parent = elementToNode.get(parentEl);
    expect(parent.name).toBe("parent");
    const childB = parent.children[1];
    expect(childB.children[0].name).toBe("grandchild");
    const childAEl = document.querySelector('[data-component="child-a"]');
    const childANode = elementToNode.get(childAEl);
    expect(childANode.parent).toBe(parent);
  });
});
