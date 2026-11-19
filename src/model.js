const collections = new WeakMap(); // ModelClass -> Model[]
const changeHandlers = new WeakMap(); // ModelClass -> Set<fn>: shape OR fields
const collectionHandlers = new WeakMap(); // ModelClass -> Set<fn>: shape only

const notify = (map, ModelClass) =>
  map.get(ModelClass)?.forEach((handler) => handler());

const subscribe = (map, ModelClass, handler) => {
  let handlers = map.get(ModelClass);
  if (!handlers) map.set(ModelClass, (handlers = new Set()));
  handlers.add(handler);
  return () => handlers.delete(handler);
};

const notifyChange = (ModelClass) => {
  notify(collectionHandlers, ModelClass);
  notify(changeHandlers, ModelClass);
};

export const Reactive = (Base = Object) =>
  class extends Base {
    static hasMany = []; // [ChildModel, ...]
    static belongsTo = []; // [OwnerModel, ...]

    #components = new Set();

    static add(attributesOrInstance = {}) {
      const instance =
        attributesOrInstance instanceof this
          ? attributesOrInstance
          : new this(attributesOrInstance);
      if (this.loaded.includes(instance)) return instance;

      const existing = instance.id == null ? null : this.byId(instance.id);
      if (existing) return existing.update(instance);

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
        this.loaded.find((instance) => String(instance.id) === String(id)) ??
        null
      );
    }

    // Any change: a record added/removed/loaded, or a field on one of them.
    static onChange(handler) {
      return subscribe(changeHandlers, this, handler);
    }

    // Only which records exist — what a container needs to refill.
    static onCollectionChange(handler) {
      return subscribe(collectionHandlers, this, handler);
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

    rerender() {
      this.#components.forEach((component) => component.update());
      notify(changeHandlers, this.constructor);
      return this;
    }

    update(partial = {}) {
      Object.assign(this, partial);
      return this.rerender();
    }

    del() {
      collections.set(
        this.constructor,
        this.constructor.loaded.filter((instance) => instance !== this),
      );
      notifyChange(this.constructor);
      return this;
    }
  };

export default class Model extends Reactive() {
  constructor(attributes = {}) {
    super(attributes);
    Object.assign(this, attributes);
  }
}
