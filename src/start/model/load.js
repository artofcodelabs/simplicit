import { AS_OF, MODEL } from "../../attributes.js";

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
  const asOf = script.getAttribute(AS_OF);
  script.remove();
  return asOf;
};

export const load = (searchRoot, modelClasses) =>
  [...searchRoot.querySelectorAll(MODEL_SCRIPT_SELECTOR)]
    .map((script) => loadModelScript(script, modelClasses))
    .filter((asOf) => asOf != null);
