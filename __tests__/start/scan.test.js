import {
  resolveSearchRoot,
  scanComponentElements,
  buildElementTree,
} from "../../src/start/scan";

describe("start/scan", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves provided Document to document.body", () => {
    expect(resolveSearchRoot(document)).toBe(document.body);
  });

  it("scans for [data-component] under root and includes root when applicable", () => {
    document.body.innerHTML = `
      <div data-component="root">
        <div data-component="child"></div>
      </div>
    `;
    const root = document.querySelector('[data-component="root"]');
    const els = scanComponentElements(root);
    expect(els[0]).toBe(root);
    expect(els.some((e) => e.getAttribute("data-component") === "child")).toBe(
      true,
    );
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
    const els = scanComponentElements(document.body);
    const elementToNode = buildElementTree(els);
    const parent = elementToNode.get(els[0]);
    expect(parent.name).toBe("parent");
    const childB = parent.children[1];
    expect(childB.children[0].name).toBe("grandchild");
    const childAEl = document.querySelector('[data-component="child-a"]');
    const childANode = elementToNode.get(childAEl);
    expect(childANode.parent).toBe(parent);
  });
});
