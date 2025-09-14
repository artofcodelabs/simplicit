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
    const nodes = buildElementTree(root);
    const elements = nodes.map((n) => n.element);
    expect(elements[0]).toBe(root);
    expect(
      elements.some((e) => e.getAttribute("data-component") === "child"),
    ).toBe(true);
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
    const nodes = buildElementTree(document.body);
    const parent = nodes.find((n) => n.name === "parent");
    expect(parent.name).toBe("parent");
    const childB = parent.children[1];
    expect(childB.children[0].name).toBe("grandchild");
    const childANode = nodes.find((n) => n.name === "child-a");
    expect(childANode.parent).toBe(parent);
  });
});
