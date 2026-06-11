import { destructArray, setProps, root } from "./start/helpers.js";
import { morph } from "./start/morph.js";

export default class Component {
  #cleanupCallbacks = [];
  #bindings = [];
  #isDisconnected = false;

  static render(props) {
    return setProps(this.template(props), props);
  }

  constructor() {
    this.props = {};
  }

  get element() {
    return this.node.element;
  }

  get parent() {
    return this.node.parent ? this.node.parent.element.instance : null;
  }

  addParent(parent) {
    this.node.parent = parent.node;
    parent.node.children.push(this.node);
  }

  registerCleanup(callback) {
    this.#cleanupCallbacks.push(callback);
    return callback;
  }

  on(target, type, listener, options) {
    const ref =
      typeof target === "string"
        ? target
        : target instanceof Element
          ? target.getAttribute("data-ref")
          : null;
    const resolve =
      ref !== null ? () => this.#refElements(ref) : () => [target];
    const binding = { resolve, type, listener, options, bound: new Set() };
    this.#bindings.push(binding);
    this.#applyBinding(binding);
    return this.registerCleanup(() => {
      for (const el of binding.bound) {
        el.removeEventListener(type, listener, options);
      }
      const index = this.#bindings.indexOf(binding);
      if (index !== -1) this.#bindings.splice(index, 1);
    });
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
    if (this.#isDisconnected) return;
    this.#isDisconnected = true;
    const callbacks = this.#cleanupCallbacks.splice(0);
    for (const cleanup of callbacks) cleanup();
    this.#detachFromParent();
  }

  ref(name) {
    return destructArray(this.#refElements(name));
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

  ancestor(name) {
    let node = this.node.parent;
    while (node) {
      if (node.name === name) return node.element.instance;
      node = node.parent;
    }
    return null;
  }

  descendants(name) {
    const out = [];
    const visited = new Set();

    const walk = (node) => {
      for (const child of node.children) {
        if (visited.has(child)) continue;
        visited.add(child);
        if (child.name === name) {
          out.push(child.element.instance);
        }
        walk(child);
      }
    };

    walk(this.node);
    return out;
  }

  update(partial = {}) {
    Object.assign(this.props, partial);
    morph(this.element, root(this.constructor.template(this.props)));
    this.#applyBindings();
    return this;
  }

  #applyBindings() {
    for (const binding of this.#bindings) this.#applyBinding(binding);
  }

  #applyBinding(binding) {
    const { resolve, type, listener, options, bound } = binding;
    const current = new Set(resolve());
    for (const el of bound) {
      if (!current.has(el)) el.removeEventListener(type, listener, options);
    }
    for (const el of current) {
      if (!bound.has(el)) el.addEventListener(type, listener, options);
    }
    binding.bound = current;
  }

  #refElements(name) {
    return Array.from(this.element.querySelectorAll(`[data-ref="${name}"]`));
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
