const modelScripts = (searchRoot) =>
  searchRoot.querySelectorAll("script[type='application/json'][data-model]");

export const loadModelScript = (script, modelClasses) => {
  const name = script.dataset.model;
  const modelClass = modelClasses.find((m) => m.name === name);
  if (!modelClass) {
    throw new Error(
      `Found data-model="${name}" but no matching Model passed to start({ models })`,
    );
  }

  modelClass.load(JSON.parse(script.textContent));
  script.remove();
};

export const load = (searchRoot, modelClasses) => {
  for (const script of modelScripts(searchRoot)) {
    loadModelScript(script, modelClasses);
  }
};
