import { morph } from "../../src/start/morph";
import { root } from "../../src/start/helpers";

const mount = (html) => {
  document.body.innerHTML = html;
  return document.body.firstElementChild;
};

describe("root", () => {
  it("returns the root element, ignoring surrounding whitespace", () => {
    const el = root(`\n  <div class="x"><span>hi</span></div>\n`);
    expect(el.tagName).toBe("DIV");
    expect(el.getAttribute("class")).toBe("x");
    expect(el.firstElementChild.textContent).toBe("hi");
  });
});

describe("morph", () => {
  it("patches text without replacing the element (identity preserved)", () => {
    const from = mount(`<div><span>old</span></div>`);
    const span = from.firstElementChild;

    morph(from, root(`<div><span>new</span></div>`));

    expect(from.firstElementChild).toBe(span);
    expect(span.textContent).toBe("new");
  });

  it("preserves event listeners on kept nodes", () => {
    const from = mount(`<div><button>go</button></div>`);
    const button = from.firstElementChild;
    let clicks = 0;
    button.addEventListener("click", () => clicks++);

    morph(from, root(`<div><button>go again</button></div>`));

    from.firstElementChild.click();
    expect(clicks).toBe(1);
    expect(button.textContent).toBe("go again");
  });

  it("adds, updates, and removes attributes", () => {
    const from = mount(`<div id="a" hidden title="t"></div>`);

    morph(from, root(`<div id="b" data-x="1"></div>`));

    expect(from.getAttribute("id")).toBe("b");
    expect(from.getAttribute("data-x")).toBe("1");
    expect(from.hasAttribute("hidden")).toBe(false);
    expect(from.hasAttribute("title")).toBe(false);
  });

  it("never strips framework-managed attributes", () => {
    const from = mount(
      `<div data-component-id="7" data-props='{"a":1}'></div>`,
    );

    morph(from, root(`<div></div>`));

    expect(from.getAttribute("data-component-id")).toBe("7");
    expect(from.getAttribute("data-props")).toBe('{"a":1}');
  });

  it("replaces a child when the tag changes", () => {
    const from = mount(`<div><span data-ref="x">a</span></div>`);
    const span = from.firstElementChild;

    morph(from, root(`<div><b data-ref="x">a</b></div>`));

    expect(from.firstElementChild).not.toBe(span);
    expect(from.firstElementChild.tagName).toBe("B");
  });

  it("appends and removes children to match the new tree", () => {
    const from = mount(`<ul><li>1</li><li>2</li><li>3</li></ul>`);

    morph(from, root(`<ul><li>1</li></ul>`));
    expect(from.children).toHaveLength(1);

    morph(from, root(`<ul><li>1</li><li>2</li></ul>`));
    expect(from.children).toHaveLength(2);
    expect(from.lastElementChild.textContent).toBe("2");
  });
});
