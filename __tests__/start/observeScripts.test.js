import { observeScripts } from "../../src/start/observeScripts";
import { Component } from "index";
import { waitFor } from "../support";

class Slide extends Component {
  static name = "slide";
  static template = ({ text }) => `<div data-component="slide">${text}</div>`;
}

describe("observeScripts", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("processes scripts added after observation begins", async () => {
    document.body.innerHTML = `<div id="slideshow"></div>`;

    const observer = observeScripts(document.body, [Slide]);

    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.dataset.target = "slideshow";
    script.dataset.position = "beforeend";
    script.textContent = JSON.stringify([{ text: "A" }, { text: "B" }]);

    document.body.appendChild(script);

    const target = document.getElementById("slideshow");
    await waitFor(
      () => target.querySelectorAll('[data-component="slide"]').length === 2,
    );

    observer.disconnect();
  });

  it("defers processing when component class isn't registered yet, then processes after addComponents()", async () => {
    document.body.innerHTML = `<div id="slideshow"></div>`;

    const observer = observeScripts(document.body, []);

    let script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.dataset.target = "slideshow";
    script.textContent = JSON.stringify([{ text: "A" }]);
    document.body.appendChild(script);

    const target = document.getElementById("slideshow");
    await expect(
      waitFor(
        () => target.querySelectorAll('[data-component="slide"]').length === 1,
      ),
    ).rejects.toThrow("timeout");

    observer.addComponents([Slide]);

    await waitFor(
      () => target.querySelectorAll('[data-component="slide"]').length === 1,
    );

    script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.dataset.target = "slideshow";
    script.textContent = JSON.stringify([{ text: "B" }]);
    document.body.appendChild(script);

    await waitFor(
      () => target.querySelectorAll('[data-component="slide"]').length === 2,
    );

    observer.disconnect();
  });

  it("removes the script element once rendered", async () => {
    document.body.innerHTML = `<div id="slideshow"></div>`;

    const observer = observeScripts(document.body, [Slide]);

    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.dataset.target = "slideshow";
    script.textContent = JSON.stringify([{ text: "A" }]);
    document.body.appendChild(script);

    const target = document.getElementById("slideshow");
    await waitFor(
      () => target.querySelectorAll('[data-component="slide"]').length === 1,
    );
    expect(
      document.querySelector('script[type="application/json"]'),
    ).toBeNull();

    observer.disconnect();
  });

  it("renders in place when data-target is absent", async () => {
    document.body.innerHTML = `<div id="slideshow"><span id="anchor"></span></div>`;

    const observer = observeScripts(document.body, [Slide]);

    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.textContent = JSON.stringify([{ text: "A" }]);
    document.getElementById("anchor").after(script);

    await waitFor(
      () =>
        document.querySelectorAll('#slideshow [data-component="slide"]')
          .length === 1,
    );

    const slide = document.querySelector('[data-component="slide"]');
    // inserted beforebegin of the (now removed) script, right after the anchor
    expect(slide.previousElementSibling.id).toBe("anchor");

    observer.disconnect();
  });

  it("attaches the template data as data-props on each rendered root", async () => {
    document.body.innerHTML = `<div id="slideshow"></div>`;

    const observer = observeScripts(document.body, [Slide]);

    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.component = "slide";
    script.dataset.target = "slideshow";
    script.textContent = JSON.stringify([{ text: "A" }, { text: "B" }]);
    document.body.appendChild(script);

    const target = document.getElementById("slideshow");
    await waitFor(
      () => target.querySelectorAll('[data-component="slide"]').length === 2,
    );

    const slides = target.querySelectorAll('[data-component="slide"]');
    expect(JSON.parse(slides[0].getAttribute("data-props"))).toEqual({
      text: "A",
    });
    expect(JSON.parse(slides[1].getAttribute("data-props"))).toEqual({
      text: "B",
    });

    observer.disconnect();
  });
});
