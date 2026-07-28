import { root } from "../helpers.js";
import { pluralize } from "./associations.js";

const keyed = new WeakSet();

const assertKeyed = (ComponentClass) => {
  if (keyed.has(ComponentClass)) return;
  if (!root(ComponentClass.template({}))?.hasAttribute("data-key")) {
    throw new Error(
      `Component "${ComponentClass.name}" is a Model representation but its ` +
        `template has no data-key — add data-key="\${id}" to the root element ` +
        `so each record binds to its component.`,
    );
  }
  keyed.add(ComponentClass);
};

const modelForComponent = (name, modelClasses) =>
  modelClasses.find((M) => (M.components ?? []).some((c) => c.name === name)) ??
  null;

// Resolve which records fill a container by walking up to the nearest enclosing
// component whose Model *has many* of the container's component. The owner is
// found via its data-key + Model — never via a live instance — so it's correct
// even for a just-inserted element the binder hasn't reached yet (otherwise the
// walk would skip it and wrongly attribute its container to a grandparent).
const recordsFor = (el, Child, modelClasses) => {
  while (el) {
    if (el.matches?.("[data-component]") && el.dataset.key != null) {
      const Owner = modelForComponent(
        el.getAttribute("data-component"),
        modelClasses,
      );
      if (Owner && (Owner.hasMany ?? []).includes(Child)) {
        const owner = Owner.byId(el.dataset.key);
        return owner ? owner[pluralize(Child.name)] : [];
      }
    }
    el = el.parentElement;
  }
  return Child.loaded;
};

const fill = (container, ComponentClass, modelClasses) => {
  assertKeyed(ComponentClass);
  ComponentClass.renderTemplates(
    container,
    recordsFor(container.parentElement, ComponentClass.Model, modelClasses),
  );
};

export const CONTAINER_ATTR = "data-container-component";

export const representationFor = (name, modelClasses) => {
  for (const ModelClass of modelClasses) {
    const ComponentClass = (ModelClass.components ?? []).find(
      (c) => c.name === name,
    );
    if (ComponentClass) return ComponentClass;
  }
  return null;
};

export const renderContainers = (searchRoot, ComponentClass, modelClasses) => {
  searchRoot
    .querySelectorAll(`[${CONTAINER_ATTR}="${ComponentClass.name}"]`)
    .forEach((container) => fill(container, ComponentClass, modelClasses));
};

export const renderContainer = (container, modelClasses) => {
  const ComponentClass = representationFor(
    container.getAttribute(CONTAINER_ATTR),
    modelClasses,
  );
  if (ComponentClass) fill(container, ComponentClass, modelClasses);
};

export const render = (searchRoot, modelClasses) => {
  searchRoot
    .querySelectorAll(`[${CONTAINER_ATTR}]`)
    .forEach((container) => renderContainer(container, modelClasses));
};
