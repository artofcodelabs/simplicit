import { root } from "../helpers.js";

const anchorFor = (searchRoot, ComponentClass) =>
  searchRoot.querySelector(
    `script[type="application/json"][data-component="${ComponentClass.name}"]`,
  );

const assertKeyed = (ComponentClass) => {
  if (!root(ComponentClass.template({}))?.hasAttribute("data-key")) {
    throw new Error(
      `Component "${ComponentClass.name}" is a Model representation but its ` +
        `template has no data-key — add data-key="\${id}" to the root element ` +
        `so each record binds to its component.`,
    );
  }
};

export const render = (searchRoot, modelClasses) => {
  for (const ModelClass of modelClasses) {
    for (const ComponentClass of ModelClass.components ?? []) {
      const anchor = anchorFor(searchRoot, ComponentClass);
      if (!anchor) continue;

      assertKeyed(ComponentClass);

      const container = anchor.parentElement;
      anchor.remove();

      const renderAll = () =>
        ComponentClass.renderTemplates(container, ModelClass.all);
      renderAll();
      ModelClass.onChange(renderAll);
    }
  }
};
