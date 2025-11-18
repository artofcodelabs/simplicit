export default class Component {
  constructor() {
    this._cleanupCallbacks = [];
    this._isDisconnected = false;
  }

  addParent(parent) {
    this.node.parent = parent.node;
    parent.node.children.push(this.node);
  }

  registerCleanup(callback) {
    if (typeof callback === "function") this._cleanupCallbacks.push(callback);
    return callback;
  }

  on(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    const off = () => target.removeEventListener(type, listener, options);
    this.registerCleanup(off);
    return off;
  }

  timeout(callback, delay) {
    const id = setTimeout(callback, delay);
    this.registerCleanup(() => clearTimeout(id));
    return id;
  }

  interval(callback, delay) {
    const id = setInterval(callback, delay);
    this.registerCleanup(() => clearInterval(id));
    return id;
  }

  disconnect() {
    if (this._isDisconnected) return;
    this._isDisconnected = true;
    const callbacks = this._cleanupCallbacks.splice(0);
    for (const cleanup of callbacks) cleanup();
  }

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

  parent() {
    return this.node.parent?.element.instance;
  }

  children() {
    return this.node.children.map((n) => n.element.instance);
  }

  siblings(name) {
    const instances = this.node.siblings
      .filter((n) => n.name === name)
      .map((n) => n.element.instance);
    return instances.length === 1 ? instances[0] : instances;
  }
}
