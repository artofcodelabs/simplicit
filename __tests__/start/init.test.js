import { initMatches } from "../../src/start/init";
import { Component } from "index";
import { buildElementTree } from "../../src/start/scan";

let seen = [];

class Hello extends Component {
  static name = "hello";
  connect() {
    seen.push(this.element);
  }
}

describe("initializeMatches", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    seen = [];
  });

  it("initializes instances for matching nodes and calls connect", () => {
    document.body.innerHTML = `
      <div data-component="hello"></div>
      <div data-component="other"></div>
    `;

    const nodes = buildElementTree(document.body);

    initMatches(nodes, [Hello]);

    expect(seen).toHaveLength(1);
    expect(seen[0].getAttribute("data-component")).toBe("hello");
    const el = seen[0];
    expect(el.instance).toBeDefined();
    expect(el.getAttribute("data-component-id")).toMatch(/\d+/);
  });
});
