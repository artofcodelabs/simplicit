import { start, Component } from "index";

describe("Component.ref", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns element matching data-ref within component root", () => {
    document.body.innerHTML = `
      <div data-component="dummy" id="root">
        <input data-ref="input" />
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

    expect(seen.inside).toBe(
      document.getElementById("root").querySelector('[data-ref="input"]'),
    );
    expect(seen.inside).not.toBe(seen.outside);
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

    expect(missing).toBeNull();
  });
});
