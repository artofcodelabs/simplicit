import { MODEL } from "../../attributes.js";

export const MODEL_SCRIPT_SELECTOR = `script[type='application/json'][${MODEL}]`;

export const loadModelScript = (script, modelClasses) => {
  const name = script.getAttribute(MODEL);
  const modelClass = modelClasses.find((m) => m.name === name);
  if (!modelClass) {
    throw new Error(
      `Found ${MODEL}="${name}" but no matching Model passed to start({ models })`,
    );
  }

  modelClass.load(JSON.parse(script.textContent));
  script.remove();
};

export const load = (searchRoot, modelClasses) => {
  for (const script of searchRoot.querySelectorAll(MODEL_SCRIPT_SELECTOR)) {
    loadModelScript(script, modelClasses);
  }
};
