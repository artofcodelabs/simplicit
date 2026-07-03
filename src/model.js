const collections = new WeakMap(); // ModelClass -> Model[]
const changeHandlers = new WeakMap(); // ModelClass -> Set<fn> (collection-level)

const notifyChange = (ModelClass) =>
  changeHandlers.get(ModelClass)?.forEach((handler) => handler());

export default class Model {
  #components = new Set();

  static build(attributes) {
    return attributes instanceof this ? attributes : new this(attributes);
  }

  static create(attributes = {}) {
    const instance = this.build(attributes);
    collections.set(this, [...this.all, instance]);
    notifyChange(this);
    return instance;
  }

  static load(items) {
    collections.set(
      this,
      items.map((item) => this.build(item)),
    );
    notifyChange(this);
    return this.all;
  }

  static get all() {
    return collections.get(this) ?? [];
  }

  static find(id) {
    return (
      this.all.find((instance) => String(instance.id) === String(id)) ?? null
    );
  }

  static onChange(handler) {
    let handlers = changeHandlers.get(this);
    if (!handlers) changeHandlers.set(this, (handlers = new Set()));
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  constructor(attributes = {}) {
    Object.assign(this, attributes);
  }

  get components() {
    return [...this.#components];
  }

  bind(component) {
    this.#components.add(component);
    component.model = this;
  }

  unbind(component) {
    this.#components.delete(component);
    component.model = null;
  }

  update(partial = {}) {
    Object.assign(this, partial);
    this.#components.forEach((component) => component.update());
    return this;
  }
}
