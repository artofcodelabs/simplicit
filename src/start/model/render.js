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

export const representationFor = (name, modelClasses) => {
  for (const ModelClass of modelClasses) {
    const ComponentClass = (ModelClass.components ?? []).find(
      (c) => c.name === name,
    );
    if (ComponentClass) return ComponentClass;
  }
  return null;
};

export const renderAnchor = (anchor, ComponentClass) => {
  const container = anchor.parentElement;
  if (!container) return;
  assertKeyed(ComponentClass);

  anchor.remove();
  const ModelClass = ComponentClass.Model;
  let off;
  const renderAll = () => {
    if (!container.isConnected) return off();
    ComponentClass.renderTemplates(container, ModelClass.all);
  };
  off = ModelClass.onChange(renderAll);
  renderAll();
};

export const render = (searchRoot, modelClasses) => {
  searchRoot
    .querySelectorAll("script[type='application/json'][data-component]")
    .forEach((anchor) => {
      const ComponentClass = representationFor(
        anchor.dataset.component,
        modelClasses,
      );
      if (ComponentClass) renderAnchor(anchor, ComponentClass);
    });
};
