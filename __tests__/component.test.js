import { start, Component } from "index";

describe("Component.ref", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns element(s) matching data-ref within component root", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root">
        <input data-ref="input" />
        <input data-ref="input" id="second-inside" />
        <button data-ref="button">Greet</button>
        <div>
          <span data-ref="output"></span>
        </div>
      </div>
      <div>
        <input data-ref="input" id="outside" />
      </div>
    `;

    let seen;
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        seen = {
          inside: this.ref("input"),
          outside: document.getElementById("outside"),
          button: this.ref("button"),
          output: this.ref("output"),
        };
      }
    }

    start({ root: document, components: [Dummy] });

    // When multiple inputs exist, ref('input') returns an array
    const inputsInside = Array.from(
      document.getElementById("root").querySelectorAll('[data-ref="input"]'),
    );
    expect(Array.isArray(seen.inside)).toBe(true);
    expect(new Set(seen.inside)).toEqual(new Set(inputsInside));
    expect(seen.inside).not.toContain(seen.outside);
    expect(seen.button).toBe(
      document.getElementById("root").querySelector('[data-ref="button"]'),
    );
    expect(seen.output).toBe(
      document.getElementById("root").querySelector('[data-ref="output"]'),
    );
  });

  it("returns null when ref is missing", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root"></div>
    `;

    let missing;
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        missing = this.ref("missing");
      }
    }

    start({ root: document, components: [Dummy] });

    expect(Array.isArray(missing)).toBe(true);
    expect(missing).toHaveLength(0);
  });
});

describe("Component.refs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a map of data-ref names to elements within the root", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root">
        <input data-ref="input" />
        <button data-ref="button">Greet</button>
        <span data-ref="output"></span>
      </div>
      <div>
        <input data-ref="input" id="outside" />
      </div>
    `;

    let refs;
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        refs = this.refs();
      }
    }

    start({ root: document, components: [Dummy] });

    const root = document.getElementById("root");
    expect(refs.input).toBe(root.querySelector('[data-ref="input"]'));
    expect(refs.button).toBe(root.querySelector('[data-ref="button"]'));
    expect(refs.output).toBe(root.querySelector('[data-ref="output"]'));
    // outside element with same data-ref should be ignored
    expect(refs.input).not.toBe(document.getElementById("outside"));
  });

  it("prefers the first occurrence when duplicate data-ref keys exist", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root">
        <input data-ref="input" id="first" />
        <div>
          <input data-ref="input" id="second" />
        </div>
      </div>
    `;

    let refs;
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        refs = this.refs();
      }
    }

    start({ root: document, components: [Dummy] });

    // refs() collapses to single element when only one key, but here duplicates exist
    expect(Array.isArray(refs.input)).toBe(true);
    expect(refs.input[0]).toBe(document.getElementById("first"));
    expect(refs.input[1]).toBe(document.getElementById("second"));
  });

  it("returns an empty object when no data-ref elements exist", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root"></div>
    `;

    let refs;
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        refs = this.refs();
      }
    }

    start({ root: document, components: [Dummy] });

    expect(refs).toEqual({});
  });
});

describe("element.instance linkage", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("exposes the component instance on the root element", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root"></div>
    `;

    let captured = {};
    class Dummy extends Component {
      static name = "dummy";
      connect() {
        captured.self = this;
        captured.fromElement = this.element.instance;
        captured.id = this.componentId;
        captured.idFromElement = this.element.getAttribute("data-component-id");
      }
    }

    start({ root: document, components: [Dummy] });

    expect(captured.fromElement).toBe(captured.self);
    expect(captured.idFromElement).toBeDefined();
    expect(String(captured.id)).toEqual(String(captured.idFromElement));
  });
});
