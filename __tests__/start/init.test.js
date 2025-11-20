import { initMatches, initComponent } from "../../src/start/init";
import { Component } from "index";
import { buildElementTree } from "../../src/start/scan";

let seen = [];

class Hello extends Component {
  static name = "hello";
  connect() {
    seen.push(this.element);
  }
}

describe("initComponent", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("assigns element and exposes only structural node links (sanitized)", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root"></div>
    `;

    const element = document.getElementById("root");
    const parent = { some: "parent-node" };
    const children = [{ some: "child-node" }];
    const siblings = [{ some: "sibling-node" }];

    const node = {
      name: "dummy",
      element,
      parent,
      children,
      siblings,
    };

    class Dummy extends Component {
      static name = "dummy";
    }

    const instance = initComponent(node, Dummy);

    expect(instance.element).toBe(element);
    expect(instance.node.parent).toBe(parent);
    expect(instance.node.children).toBe(children);
    expect(instance.node.siblings).toBe(siblings);
    expect("name" in instance.node).toBe(false);
    expect("element" in instance.node).toBe(false);
  });
});

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
