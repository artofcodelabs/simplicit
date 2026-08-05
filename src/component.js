import DOMPurify from "dompurify";
import { COMPONENT, KEY, REF } from "./attributes.js";
import { destructArray, setProps, root } from "./start/helpers.js";
import { morph } from "./start/morph.js";

// Matches within one component only — excludes elements that live inside a
// nested child component (whose nearest [data-component] ancestor isn't root).
const scopedQuery = (root, selector) =>
  Array.from(root.querySelectorAll(selector)).filter(
    (el) => el.closest(`[${COMPONENT}]`) === root,
  );

export default class Component {
  static Model = null;

  static toHTML(props) {
    return setProps(this.template(props), props);
  }

  static renderTemplates(container, propsList) {
    const next = container.cloneNode(false);
    next.innerHTML = DOMPurify.sanitize(
      propsList.map((props) => this.template(props)).join(""),
    );
    morph(container, next);
  }

  #cleanupCallbacks = [];
  #bindings = [];

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
          ? target.getAttribute(REF)
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

  // Idempotent: splice empties the queue, #detachFromParent no-ops when detached.
  disconnect() {
    const callbacks = this.#cleanupCallbacks.splice(0);
    for (const cleanup of callbacks) cleanup();
    this.#detachFromParent();
  }

  ref(name) {
    return destructArray(this.#refElements(name));
  }

  refs() {
    const grouped = {};
    for (const el of scopedQuery(this.element, `[${REF}]`)) {
      const key = el.getAttribute(REF);
      (grouped[key] ??= []).push(el);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key] = destructArray(grouped[key]);
    }
    return grouped;
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
    this.#render();
    return this;
  }

  connectModel() {
    const Model = this.constructor.Model;
    if (!Model) return;

    const record = Model.byId(this.element.getAttribute(KEY));
    if (!record) return;

    record.bind(this);
    this.registerCleanup(() => record.unbind(this));
    this.update();
  }

  #render() {
    const props = this.model ? { ...this.props, ...this.model } : this.props;
    morph(this.element, root(this.constructor.template(props)));
    this.#applyBindings();
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
    return scopedQuery(this.element, `[${REF}="${name}"]`);
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
