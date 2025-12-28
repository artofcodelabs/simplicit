import { destructArray } from "./start/helpers";

export default class Component {
  constructor() {
    this._cleanupCallbacks = [];
    this._isDisconnected = false;
  }

  get element() {
    return this.node.element;
  }

  get parent() {
    return this.node.parent?.element.instance;
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
    this.#detachFromParent();
  }

  ref(name) {
    const list = Array.from(
      this.element.querySelectorAll(`[data-ref="${name}"]`),
    );
    return destructArray(list);
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
      result[key] = destructArray(temp[key]);
    });
    return result;
  }

  children(name) {
    return this.#related("children", name);
  }

  siblings(name) {
    return this.#related("siblings", name);
  }

  #related(type, name) {
    const names = Array.isArray(name) ? name : [name];
    const nameSet = new Set(names);
    return this.node[type]
      .filter((n) => nameSet.has(n.name))
      .map((n) => n.element.instance);
  }

  #detachFromParent() {
    const parentNode = this.node.parent;
    if (!parentNode) return;
    const index = parentNode.children.indexOf(this.node);
    if (index !== -1) parentNode.children.splice(index, 1);
    this.node.parent = null;
  }
}
