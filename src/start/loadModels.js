const modelScripts = (searchRoot) =>
  searchRoot.querySelectorAll("script[type='application/json'][data-model]");

export const loadModels = (searchRoot, modelClasses) => {
  for (const script of modelScripts(searchRoot)) {
    const name = script.dataset.model;
    const modelClass = modelClasses.find((m) => m.name === name);
    if (!modelClass) {
      throw new Error(
        `Found data-model="${name}" but no matching Model passed to start({ models })`,
      );
    }

    modelClass.load(JSON.parse(script.textContent));
    script.remove();
  }
};
