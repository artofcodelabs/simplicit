import { validate } from "../../src/start/validate";
import { buildElementTree } from "../../src/start/scan";

describe("validate", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("throws when no component elements in root", () => {
    const nodes = [];
    expect(() => validate(nodes, [])).toThrow(/No component elements found/);
  });

  it("throws when component class lacks a proper static name", () => {
    document.body.innerHTML = `
      <div data-component="good"></div>
    `;
    const nodes = buildElementTree(document.body);
    class Good {
      static name = "good";
    }
    class Bad1 {
      static name = "";
    }
    class Bad2 {}
    expect(() => validate(nodes, [Good, Bad1])).toThrow(
      /Invalid component class: missing static name/,
    );
    expect(() => validate(nodes, [Good, Bad2])).toThrow(
      /Invalid component class: missing static name/,
    );
  });

  it("throws when DOM has data-component without a provided class", () => {
    document.body.innerHTML = `
      <div data-component="missing"></div>
    `;
    const nodes = buildElementTree(document.body);
    expect(() => validate(nodes, [])).toThrow(
      /Found data-component="missing" but no matching class passed to start/,
    );
  });
});
