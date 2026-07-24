const collections = new WeakMap(); // ModelClass -> Model[]
const changeHandlers = new WeakMap(); // ModelClass -> Set<fn> (collection-level)

const notifyChange = (ModelClass) =>
  changeHandlers.get(ModelClass)?.forEach((handler) => handler());

export default class Model {
  static hasMany = []; // [ChildModel, ...]
  static belongsTo = []; // [OwnerModel, ...]

  #components = new Set();

  static add(attributes = {}) {
    const instance = new this(attributes);
    collections.set(this, [...this.loaded, instance]);
    notifyChange(this);
    return instance;
  }

  static load(items) {
    collections.set(
      this,
      items.map((attributes) => new this(attributes)),
    );
    notifyChange(this);
    return this.loaded;
  }

  static get loaded() {
    return collections.get(this) ?? [];
  }

  static byId(id) {
    return (
      this.loaded.find((instance) => String(instance.id) === String(id)) ?? null
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

  del() {
    collections.set(
      this.constructor,
      this.constructor.loaded.filter((instance) => instance !== this),
    );
    notifyChange(this.constructor);
    return this;
  }
}
