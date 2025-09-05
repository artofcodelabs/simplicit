export default class Component {
  ref(name) {
    return this.element.querySelector(`[data-ref="${name}"]`);
  }

  refs() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-ref]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-ref");
      if (!(key in result)) {
        result[key] = el;
      }
    });
    return result;
  }
}
