// A Model's name may be namespaced ("Article.Comment", mirroring Rails'
// Article::Comment). Association members are named after the final segment, so
// an Article has `comments` and a Comment belongs to `article` — never
// `article["article.Comments"]`.
const member = (name) => name.split(".").pop();

const lower = (name) =>
  member(name).charAt(0).toLowerCase() + member(name).slice(1);

// BlogPost → blog_post, matching Rails column names.
const snake = (name) =>
  member(name)
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .toLowerCase();

// ponytail: consonant + y → ies, else + s. Irregular plurals (person, child)
// aren't handled; declare a getter yourself if you need one.
export const pluralize = (name) =>
  `${lower(name).replace(/([^aeiou])y$/, "$1ie")}s`;

export const foreignKey = (OwnerClass) => `${snake(OwnerClass.name)}_id`;

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
