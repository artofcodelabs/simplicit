import { observe } from "../../src/start/observe";
import { Component } from "index";

import { waitFor } from "../support";

class Clock extends Component {
  static name = "clock";
  connect() {
    this.connected = true;
  }
}

class Parent extends Component {
  static name = "parent";
}

class Child extends Component {
  static name = "child";
}

class Disposable extends Component {
  static name = "disposable";

  disconnect() {
    super.disconnect();
    this.wasDisconnected = true;
  }
}

describe("ensureObservation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("auto-initializes components added after observation begins", async () => {
    const root = document.body;
    observe(root, [Clock]);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div data-component="clock"></div>
    `;
    root.appendChild(wrapper);

    const el = root.querySelector('[data-component="clock"]');
    await waitFor(() => !!el.instance);
    expect(el.instance).toBeDefined();
    expect(el.instance.connected).toBe(true);
    expect(el.getAttribute("data-component-id")).toMatch(/\d+/);
  });

  it("links parent and child nodes for dynamically added trees", async () => {
    const root = document.body;
    observe(root, [Parent, Child]);

    // Append parent element
    const parentEl = document.createElement("div");
    parentEl.setAttribute("data-component", "parent");
    root.appendChild(parentEl);
    await waitFor(() => !!parentEl.instance);

    // Append child inside the parent
    const childEl = document.createElement("div");
    childEl.setAttribute("data-component", "child");
    parentEl.appendChild(childEl);
    await waitFor(() => !!childEl.instance);

    // Wait until linkage is established
    await waitFor(
      () =>
        !!childEl.instance &&
        !!parentEl.instance &&
        childEl.instance.node.parent === parentEl.instance.node,
    );

    expect(childEl.instance.node.parent).toBe(parentEl.instance.node);
    expect(parentEl.instance.node.children).toContain(childEl.instance.node);
  });

  it("calls disconnect on components whose elements are removed", async () => {
    const root = document.body;
    observe(root, [Disposable]);

    const el = document.createElement("div");
    el.setAttribute("data-component", "disposable");
    root.appendChild(el);

    await waitFor(() => !!el.instance);

    const instance = el.instance;
    expect(instance.wasDisconnected).toBeUndefined();

    el.remove();

    await waitFor(() => instance.wasDisconnected === true);
    expect(instance.wasDisconnected).toBe(true);
  });

  it("does not throw when component elements are removed before initialization", () => {
    const root = document.body;
    const OriginalMutationObserver = global.MutationObserver;

    class FakeMutationObserver {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        const el = document.createElement("div");
        el.setAttribute("data-component", "disposable");
        const record = {
          addedNodes: [el],
          removedNodes: [el],
        };
        this.callback([record]);
      }

      disconnect() {}

      takeRecords() {
        return [];
      }
    }

    global.MutationObserver = FakeMutationObserver;

    try {
      expect(() => {
        observe(root, [Disposable]);
      }).not.toThrow();
    } finally {
      global.MutationObserver = OriginalMutationObserver;
    }
  });

  it("updates parent children when a child component element is removed", async () => {
    const root = document.body;
    observe(root, [Parent, Child]);

    const parentEl = document.createElement("div");
    parentEl.setAttribute("data-component", "parent");
    root.appendChild(parentEl);
    await waitFor(() => !!parentEl.instance);

    const childEl = document.createElement("div");
    childEl.setAttribute("data-component", "child");
    parentEl.appendChild(childEl);
    await waitFor(() => parentEl.instance.children("child").length === 1);

    childEl.remove();

    await waitFor(() => parentEl.instance.children("child").length === 0);
  });

  it("populates siblings for dynamically added sibling components", async () => {
    const root = document.body;
    observe(root, [Parent, Child]);

    const parentEl = document.createElement("div");
    parentEl.setAttribute("data-component", "parent");
    root.appendChild(parentEl);
    await waitFor(() => !!parentEl.instance);

    const childEl1 = document.createElement("div");
    childEl1.setAttribute("data-component", "child");
    parentEl.appendChild(childEl1);

    const childEl2 = document.createElement("div");
    childEl2.setAttribute("data-component", "child");
    parentEl.appendChild(childEl2);

    await waitFor(() => !!childEl1.instance && !!childEl2.instance);

    const c1 = childEl1.instance;
    const c2 = childEl2.instance;

    await waitFor(
      () =>
        c1.siblings("child").length === 1 && c2.siblings("child").length === 1,
    );

    expect(c1.siblings("child")).toEqual([c2]);
    expect(c2.siblings("child")).toEqual([c1]);
  });
});
