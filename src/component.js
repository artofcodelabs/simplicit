export default class Component {
  ref(name) {
    const list = Array.from(
      this.element.querySelectorAll(`[data-ref="${name}"]`),
    );
    if (list.length === 0) return [];
    if (list.length === 1) return list[0];
    return list;
  }

  refs() {
    const temp = {};
    const elements = this.element.querySelectorAll("[data-ref]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-ref");
      if (!temp[key]) temp[key] = [];
      temp[key].push(el);
    });
    const result = {};
    Object.keys(temp).forEach((key) => {
      const arr = temp[key];
      result[key] = arr.length === 1 ? arr[0] : arr;
    });
    return result;
  }
}
