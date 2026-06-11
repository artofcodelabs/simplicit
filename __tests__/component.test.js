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

    expect(missing).toBeNull();
  });
});

describe("refs()", () => {
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

describe("parent()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null for a root component", () => {
    document.body.innerHTML = `
      <div data-component="root" id="root"></div>
    `;

    let captured;
    class Root extends Component {
      static name = "root";
      connect() {
        captured = this.parent;
      }
    }

    start({ root: document, components: [Root] });

    expect(captured).toBeNull();
  });

  it("returns the enclosing parent component instance for nested components", () => {
    document.body.innerHTML = `
      <div data-component="parent" id="p">
        <div data-component="child" id="c"></div>
      </div>
    `;

    const captured = {};
    class Parent extends Component {
      static name = "parent";
      connect() {
        captured.parentInstance = this;
      }
    }
    class Child extends Component {
      static name = "child";
      connect() {
        captured.childParent = this.parent;
      }
    }

    start({ root: document, components: [Parent, Child] });

    expect(captured.childParent).toBe(captured.parentInstance);
  });
});

describe("children(name)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns only direct children component instances in DOM order", () => {
    document.body.innerHTML = `
      <div data-component="parent" id="p">
        <div data-component="child" id="c1">
          <div data-component="grandchild" id="gc1"></div>
        </div>
        <div data-component="child" id="c2"></div>
      </div>
      <div data-component="child" id="outside"></div>
    `;

    const captured = {};
    class Parent extends Component {
      static name = "parent";
      connect() {
        captured.children = this.children(["child", "grandchild"]);
        captured.self = this;
      }
    }
    class Child extends Component {
      static name = "child";
    }
    class Grandchild extends Component {
      static name = "grandchild";
    }

    start({ root: document, components: [Parent, Child, Grandchild] });

    const c1 = document.getElementById("c1").instance;
    const c2 = document.getElementById("c2").instance;
    const gc1 = document.getElementById("gc1").instance;
    const outside = document.getElementById("outside").instance;

    expect(captured.children).toEqual([c1, c2]);
    expect(captured.children).not.toContain(gc1);
    expect(captured.children).not.toContain(outside);
    for (const child of captured.children) {
      expect(child.parent).toBe(captured.self);
    }
  });

  it("filters children by component name and collapses single child", () => {
    document.body.innerHTML = `
      <div data-component="parent" id="p">
        <p><div data-component="child" id="c1"></div></p>
        <div data-component="other-child" id="oc1"></div>
      </div>
    `;

    let namedChildren;
    let allChildren;
    class Parent extends Component {
      static name = "parent";
      connect() {
        namedChildren = this.children("child");
        allChildren = this.children(["child", "other-child"]);
      }
    }
    class Child extends Component {
      static name = "child";
    }
    class OtherChild extends Component {
      static name = "other-child";
    }

    start({ root: document, components: [Parent, Child, OtherChild] });

    const c1 = document.getElementById("c1").instance;
    const oc1 = document.getElementById("oc1").instance;

    expect(namedChildren).toEqual([c1]);
    expect(allChildren).toEqual([c1, oc1]);
  });
});

describe("siblings()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns sibling root components matching the given name", () => {
    document.body.innerHTML = `
      <div data-component="alpha" id="alpha"></div>
      <div data-component="beta" id="beta"></div>
      <div data-component="gamma" id="gamma"></div>
    `;

    const captured = {};
    class Alpha extends Component {
      static name = "alpha";
      connect() {
        captured.self = this;
        captured.betaSibling = this.siblings("beta");
      }
    }
    class Beta extends Component {
      static name = "beta";
    }
    class Gamma extends Component {
      static name = "gamma";
    }

    start({ root: document, components: [Alpha, Beta, Gamma] });

    const betaInstance = document.getElementById("beta").instance;

    expect(Array.isArray(captured.betaSibling)).toBe(true);
    expect(captured.betaSibling.length).toEqual(1);
    expect(captured.betaSibling[0]).toBe(betaInstance);
  });

  it("returns an array when multiple siblings share the same name", () => {
    document.body.innerHTML = `
      <div data-component="alpha" id="alpha"></div>
      <div data-component="beta" id="beta1"></div>
      <div data-component="beta" id="beta2"></div>
    `;

    let siblings;
    class Alpha extends Component {
      static name = "alpha";
      connect() {
        siblings = this.siblings("beta");
      }
    }
    class Beta extends Component {
      static name = "beta";
    }

    start({ root: document, components: [Alpha, Beta] });

    const beta1 = document.getElementById("beta1").instance;
    const beta2 = document.getElementById("beta2").instance;

    expect(Array.isArray(siblings)).toBe(true);
    expect(new Set(siblings)).toEqual(new Set([beta1, beta2]));
  });

  it("returns sibling components for nested components with the same parent", () => {
    document.body.innerHTML = `
      <div data-component="parent" id="p">
        <div data-component="child" id="c1"></div>
        <div data-component="child" id="c2"></div>
      </div>
    `;

    const captured = {};
    class Parent extends Component {
      static name = "parent";
    }
    class Child extends Component {
      static name = "child";
      connect() {
        if (!captured.first) {
          captured.first = this;
        } else {
          captured.second = this;
        }
      }
    }

    start({ root: document, components: [Parent, Child] });

    const { first, second } = captured;
    const firstSiblings = first.siblings("child");
    const secondSiblings = second.siblings("child");

    expect(firstSiblings).toHaveLength(1);
    expect(firstSiblings[0]).toBe(second);
    expect(secondSiblings).toHaveLength(1);
    expect(secondSiblings[0]).toBe(first);
  });
});

describe("ancestor(name)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the nearest matching ancestor by name (or null)", () => {
    document.body.innerHTML = `
      <div data-component="grandparent" id="gp">
        <div data-component="parent" id="p">
          <div data-component="child" id="c"></div>
        </div>
      </div>
    `;

    const captured = {};
    class Grandparent extends Component {
      static name = "grandparent";
    }
    class Parent extends Component {
      static name = "parent";
    }
    class Child extends Component {
      static name = "child";
      connect() {
        captured.parent = this.ancestor("parent");
        captured.grandparent = this.ancestor("grandparent");
        captured.none = this.ancestor("missing");
      }
    }

    start({ root: document, components: [Grandparent, Parent, Child] });

    expect(captured.parent).toBe(document.getElementById("p").instance);
    expect(captured.grandparent).toBe(document.getElementById("gp").instance);
    expect(captured.none).toBeNull();
  });
});

describe("descendants(name)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a flat array of descendants across multiple levels/branches", () => {
    document.body.innerHTML = `
      <div data-component="root" id="root">
        <div data-component="child" id="c1">
          <div data-component="leaf" id="l1"></div>
        </div>
        <div data-component="child" id="c2">
          <div data-component="mid" id="m1">
            <div data-component="leaf" id="l2"></div>
          </div>
        </div>
      </div>
    `;

    const captured = {};
    class Root extends Component {
      static name = "root";
      connect() {
        captured.leaves = this.descendants("leaf");
      }
    }
    class Child extends Component {
      static name = "child";
    }
    class Mid extends Component {
      static name = "mid";
    }
    class Leaf extends Component {
      static name = "leaf";
    }

    start({ root: document, components: [Root, Child, Mid, Leaf] });

    const l1 = document.getElementById("l1").instance;
    const l2 = document.getElementById("l2").instance;

    expect(captured.leaves).toEqual([l1, l2]);
  });
});

describe("Component.render", () => {
  it("renders the template and attaches data as data-props on the root", () => {
    class Slide extends Component {
      static name = "slide";
      static template = ({ text }) =>
        `<div data-component="slide">${text}</div>`;
    }

    const html = Slide.render({ text: "A" });
    const template = document.createElement("template");
    template.innerHTML = html;
    const root = template.content.firstElementChild;

    expect(root.textContent).toBe("A");
    expect(JSON.parse(root.getAttribute("data-props"))).toEqual({ text: "A" });
  });
});

describe("Component props", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("exposes template data as this.props on the connected instance", () => {
    let captured = null;
    class Slide extends Component {
      static name = "slide";
      static template = ({ text }) =>
        `<div data-component="slide">${text}</div>`;
      connect() {
        captured = this.props;
      }
    }

    document.body.innerHTML = Slide.render({ text: "Hello", n: 3 });
    start({ root: document, components: [Slide] });

    expect(captured).toEqual({ text: "Hello", n: 3 });
  });

  it("defaults props to an empty object for plain markup components", () => {
    let captured = "untouched";
    class Plain extends Component {
      static name = "plain";
      connect() {
        captured = this.props;
      }
    }

    document.body.innerHTML = `<div data-component="plain"></div>`;
    start({ root: document, components: [Plain] });

    expect(captured).toEqual({});
  });
});

describe("Component.update", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("merges props, re-renders, and morphs the DOM in place", () => {
    class Counter extends Component {
      static name = "counter";
      static template = ({ count = 0, label = "n" }) =>
        `<div data-component="counter"><span data-ref="out">${label}:${count}</span></div>`;
    }

    document.body.innerHTML = Counter.render({ count: 0, label: "n" });
    start({ root: document, components: [Counter] });

    const el = document.querySelector('[data-component="counter"]');
    const instance = el.instance;
    const span = el.querySelector('[data-ref="out"]');

    instance.update({ count: 1 });

    expect(instance.props).toEqual({ count: 1, label: "n" });
    expect(el.querySelector('[data-ref="out"]')).toBe(span); // identity kept
    expect(span.textContent).toBe("n:1");
  });

  it("keeps delegated listeners working across updates", () => {
    let clicks = 0;
    class Box extends Component {
      static name = "box";
      static template = ({ on = false }) =>
        `<div data-component="box"><button data-ref="b">${on ? "on" : "off"}</button></div>`;
      connect() {
        this.on(this.element, "click", () => {
          clicks++;
          this.update({ on: !this.props.on });
        });
      }
    }

    document.body.innerHTML = Box.render({ on: false });
    start({ root: document, components: [Box] });

    const el = document.querySelector('[data-component="box"]');
    el.querySelector('[data-ref="b"]').click();
    expect(el.querySelector('[data-ref="b"]').textContent).toBe("on");
    el.querySelector('[data-ref="b"]').click();
    expect(el.querySelector('[data-ref="b"]').textContent).toBe("off");
    expect(clicks).toBe(2);
  });
});

describe('Component.on("<ref>", ...)', () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("stays attached across re-renders without stacking (no leak)", () => {
    let clicks = 0;
    class Toggle extends Component {
      static name = "toggle";
      static template = ({ on = false }) =>
        `<div data-component="toggle"><button data-ref="b">${on ? "on" : "off"}</button></div>`;
      connect() {
        // Declared once. The <button> keeps identity across morphs; without
        // dedup this would stack a new handler every render.
        this.on("b", "click", () => {
          clicks++;
          this.update({ on: !this.props.on });
        });
      }
    }

    document.body.innerHTML = Toggle.render({ on: false });
    start({ root: document, components: [Toggle] });
    const el = document.querySelector('[data-component="toggle"]');

    el.querySelector('[data-ref="b"]').click(); // -> on, clicks=1
    el.querySelector('[data-ref="b"]').click(); // -> off, clicks=2
    el.querySelector('[data-ref="b"]').click(); // -> on, clicks=3

    expect(clicks).toBe(3); // one handler per click, not 1+2+4...
    expect(el.querySelector('[data-ref="b"]').textContent).toBe("on");
  });

  it("binds refs that only appear after a later update, and unbinds when gone", () => {
    let saves = 0;
    class Field extends Component {
      static name = "field";
      static template = ({ editing = false }) =>
        editing
          ? `<div data-component="field"><form data-ref="form"></form></div>`
          : `<div data-component="field"><span data-ref="label">x</span></div>`;
      connect() {
        this.on("form", "submit", () => saves++);
      }
    }

    document.body.innerHTML = Field.render({ editing: false });
    start({ root: document, components: [Field] });
    const el = document.querySelector('[data-component="field"]');
    const instance = el.instance;

    // No form yet — nothing to fire.
    expect(el.querySelector('[data-ref="form"]')).toBeNull();

    instance.update({ editing: true });
    const form = el.querySelector('[data-ref="form"]');
    form.dispatchEvent(new Event("submit"));
    expect(saves).toBe(1);

    // Form removed: the old node keeps no live binding into the component.
    instance.update({ editing: false });
    form.dispatchEvent(new Event("submit"));
    expect(saves).toBe(1);
  });

  it("unbinds ref listeners on disconnect", () => {
    let clicks = 0;
    class Btn extends Component {
      static name = "btn";
      static template = () =>
        `<div data-component="btn"><button data-ref="b">x</button></div>`;
      connect() {
        this.on("b", "click", () => clicks++);
      }
    }

    document.body.innerHTML = Btn.render({});
    start({ root: document, components: [Btn] });
    const el = document.querySelector('[data-component="btn"]');
    const button = el.querySelector('[data-ref="b"]');

    el.instance.disconnect();
    button.click();

    expect(clicks).toBe(0);
  });

  it("treats on(ref-element) the same as on(refName) — survives morph", () => {
    let clicks = 0;
    class Toggle extends Component {
      static name = "toggle2";
      static template = ({ on = false }) =>
        `<div data-component="toggle2"><button data-ref="b">${on ? "on" : "off"}</button></div>`;
      connect() {
        // passing the element, not the name — should still follow the ref
        this.on(this.ref("b"), "click", () => {
          clicks++;
          this.update({ on: !this.props.on });
        });
      }
    }

    document.body.innerHTML = Toggle.render({ on: false });
    start({ root: document, components: [Toggle] });
    const el = document.querySelector('[data-component="toggle2"]');

    el.querySelector('[data-ref="b"]').click();
    el.querySelector('[data-ref="b"]').click();
    el.querySelector('[data-ref="b"]').click();

    expect(clicks).toBe(3); // re-bound across morphs, no stacking
    expect(el.querySelector('[data-ref="b"]').textContent).toBe("on");
  });

  it("pins a fixed listener to targets without a data-ref (e.g. the root)", () => {
    let clicks = 0;
    class Box extends Component {
      static name = "box2";
      static template = ({ n = 0 }) =>
        `<div data-component="box2"><span data-ref="out">${n}</span></div>`;
      connect() {
        this.on(this.element, "click", () => clicks++);
      }
    }

    document.body.innerHTML = Box.render({ n: 0 });
    start({ root: document, components: [Box] });
    const el = document.querySelector('[data-component="box2"]');

    el.instance.update({ n: 1 }); // morph keeps the root node
    el.click();

    expect(clicks).toBe(1); // still bound once after re-render
  });
});
