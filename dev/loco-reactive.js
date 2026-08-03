import { Reactive } from "Simplicit";

export const locoReactive = (Base) =>
  class extends Reactive(Base) {
    static getIdentity() {
      return this.identity ?? this.name;
    }

    async save(...args) {
      const isCreate = this.id == null;
      const resp = await super.save(...args);
      if (isCreate && resp.success) {
        if (resp.id != null) this.id = resp.id;
        this.constructor.add(this);
      }
      return resp;
    }

    update(partial = {}) {
      for (const [key, val] of Object.entries(partial))
        this.assignAttr(key, val);
      return this.rerender();
    }

    applyChanges(...args) {
      super.applyChanges(...args);
      return this.rerender();
    }
  };
