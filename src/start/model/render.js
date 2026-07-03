const anchorFor = (searchRoot, ComponentClass) =>
  searchRoot.querySelector(
    `script[type="application/json"][data-component="${ComponentClass.name}"]`,
  );

export const render = (searchRoot, modelClasses) => {
  for (const ModelClass of modelClasses) {
    for (const ComponentClass of ModelClass.components ?? []) {
      const anchor = anchorFor(searchRoot, ComponentClass);
      if (!anchor) continue;

      const container = anchor.parentElement;
      anchor.remove();

      const renderAll = () =>
        ComponentClass.renderTemplates(container, ModelClass.all);
      renderAll();
      ModelClass.onChange(renderAll);
    }
  }
};
