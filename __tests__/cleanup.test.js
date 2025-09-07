import { start, Component } from "index";

describe("cleanup helpers", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("removes event listeners after disconnect", () => {
    document.body.innerHTML = `
      <div data-component="demo">
        <button data-ref="btn">Click</button>
      </div>
    `;

    const clicks = [];
    class Demo extends Component {
      static name = "demo";
      connect() {
        const { btn } = this.refs();
        this.on(btn, "click", () => clicks.push("clicked"));
        // trigger a click while connected
        btn.click();
      }
    }

    start({ root: document, components: [Demo] });
    const btn = document.querySelector('[data-ref="btn"]');
    expect(clicks).toEqual(["clicked"]);

    // Simulate teardown
    const el = document.querySelector('[data-component="demo"]');
    el.instance.disconnect();

    // Further clicks should not be recorded
    btn.click();
    expect(clicks).toEqual(["clicked"]);
  });

  it("clears timeouts on disconnect", () => {
    document.body.innerHTML = `
      <div data-component="demo"></div>
    `;

    let ran = false;
    class Demo extends Component {
      static name = "demo";
      connect() {
        this.timeout(() => {
          ran = true;
        }, 1000);
      }
    }

    start({ root: document, components: [Demo] });
    const el = document.querySelector('[data-component="demo"]');
    el.instance.disconnect();

    // advance timers beyond the timeout
    jest.advanceTimersByTime(2000);
    expect(ran).toBe(false);
  });

  it("clears intervals on disconnect", () => {
    document.body.innerHTML = `
      <div data-component="demo"></div>
    `;

    let count = 0;
    class Demo extends Component {
      static name = "demo";
      connect() {
        this.interval(() => {
          count += 1;
        }, 500);
      }
    }

    start({ root: document, components: [Demo] });
    // let it tick once while connected
    jest.advanceTimersByTime(600);
    expect(count).toBe(1);

    const el = document.querySelector('[data-component="demo"]');
    el.instance.disconnect();

    // further time should not increment
    jest.advanceTimersByTime(2000);
    expect(count).toBe(1);
  });
});
