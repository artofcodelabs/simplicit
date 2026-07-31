import { Reactive } from "Simplicit";

export const locoReactive = (Base) =>
  class extends Reactive(Base) {
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
