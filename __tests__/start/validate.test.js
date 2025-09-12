import { validate } from "../../src/start/validate";

describe("start/validate", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("throws when no component elements in root", () => {
    const root = document.body;
    const componentElements = root.querySelectorAll("[data-component]");
    expect(() => validate(componentElements, [])).toThrow(
      /No component elements found/,
    );
  });

  it("throws when component class lacks a proper static name", () => {
    document.body.innerHTML = `
      <div data-component="good"></div>
    `;
    const root = document.body;
    const componentElements = root.querySelectorAll("[data-component]");

    class Good {}
    Object.defineProperty(Good, "name", { value: "good", configurable: true });
    // Bad1: empty name
    const Bad1 = function () {};
    Object.defineProperty(Bad1, "name", { value: "", configurable: true });
    // Bad2: default constructor name but not explicitly set static name
    class Bad2 {}

    expect(() => validate(componentElements, [Good, Bad1])).toThrow(
      /Invalid component class: missing static name/,
    );
    expect(() => validate(componentElements, [Good, Bad2])).toThrow(
      /Invalid component class: missing static name/,
    );
  });

  it("throws when DOM has data-component without a provided class", () => {
    document.body.innerHTML = `
      <div data-component="missing"></div>
    `;
    const root = document.body;
    const componentElements = root.querySelectorAll("[data-component]");
    expect(() => validate(componentElements, [])).toThrow(
      /Found data-component="missing"/,
    );
  });
});
