import { root } from "../helpers.js";

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

const fill = (container, ComponentClass) => {
  assertKeyed(ComponentClass);
  ComponentClass.renderTemplates(container, ComponentClass.Model.all);
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

export const renderContainers = (searchRoot, ComponentClass) => {
  searchRoot
    .querySelectorAll(`[${CONTAINER_ATTR}="${ComponentClass.name}"]`)
    .forEach((container) => fill(container, ComponentClass));
};

export const renderContainer = (container, modelClasses) => {
  const ComponentClass = representationFor(
    container.getAttribute(CONTAINER_ATTR),
    modelClasses,
  );
  if (ComponentClass) fill(container, ComponentClass);
};

export const render = (searchRoot, modelClasses) => {
  searchRoot
    .querySelectorAll(`[${CONTAINER_ATTR}]`)
    .forEach((container) => renderContainer(container, modelClasses));
};
