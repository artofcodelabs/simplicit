const lower = (name) => name.charAt(0).toLowerCase() + name.slice(1);

export const pluralize = (name) => `${lower(name)}s`;

export const foreignKey = (OwnerClass) => `${lower(OwnerClass.name)}_id`;

export const wireAssociations = (modelClasses) => {
  for (const ModelClass of modelClasses) {
    for (const Owner of ModelClass.belongsTo ?? []) {
      if (!Object.hasOwn(Owner, "hasMany")) Owner.hasMany = [];
      if (!Owner.hasMany.includes(ModelClass)) Owner.hasMany.push(ModelClass);
    }
  }

  for (const ModelClass of modelClasses) {
    for (const Child of ModelClass.hasMany ?? []) {
      const fk = foreignKey(ModelClass);
      Object.defineProperty(ModelClass.prototype, pluralize(Child.name), {
        configurable: true,
        get() {
          return Child.loaded.filter((r) => String(r[fk]) === String(this.id));
        },
      });
    }

    for (const Owner of ModelClass.belongsTo ?? []) {
      const fk = foreignKey(Owner);
      Object.defineProperty(ModelClass.prototype, lower(Owner.name), {
        configurable: true,
        get() {
          return Owner.byId(this[fk]);
        },
      });
    }
  }
};
