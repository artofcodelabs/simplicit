import { ensureObservation } from "../../src/start/observer";
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

describe("ensureObservation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("auto-initializes components added after observation begins", async () => {
    const root = document.body;
    ensureObservation(root, [Clock]);

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

  it.skip("links parent and child nodes for dynamically added trees", async () => {
    const root = document.body;
    ensureObservation(root, [Parent, Child]);

    // Append parent first to ensure parent instance exists before child
    const parentEl = document.createElement("div");
    parentEl.setAttribute("data-component", "parent");
    root.appendChild(parentEl);
    await waitFor(() => !!parentEl.instance);

    const childEl = document.createElement("div");
    childEl.setAttribute("data-component", "child");
    parentEl.appendChild(childEl);
    await waitFor(() => !!childEl.instance);
    expect(parentEl.instance).toBeDefined();
    expect(childEl.instance).toBeDefined();
    expect(childEl.instance.node.parent).toBe(parentEl.instance.node);
    expect(parentEl.instance.node.children).toContain(childEl.instance.node);
  });
});
