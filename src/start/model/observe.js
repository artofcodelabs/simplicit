import { CONTAINER, MODEL } from "../../attributes.js";
import { selfAndDescendants } from "../helpers.js";
import { load, loadModelScript, MODEL_SCRIPT_SELECTOR } from "./load.js";
import { render, renderContainer, renderContainers } from "./render.js";

export const observeModels = (searchRoot, modelClasses) => {
  const modelNames = new Set();

  const registerModels = (newModelClasses) => {
    for (const ModelClass of newModelClasses) {
      modelNames.add(ModelClass.name);
      for (const ComponentClass of ModelClass.components ?? []) {
        ModelClass.onChange(() =>
          renderContainers(searchRoot, ComponentClass, modelClasses),
        );
      }
    }
    load(searchRoot, modelClasses);
    render(searchRoot, modelClasses);
  };

  registerModels(modelClasses);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        selfAndDescendants(node, MODEL_SCRIPT_SELECTOR).forEach((s) => {
          if (!s.isConnected) return;
          if (modelNames.has(s.getAttribute(MODEL))) {
            loadModelScript(s, modelClasses);
          } else {
            console.warn(
              `[simplicit] <script ${MODEL}="${s.getAttribute(MODEL)}"> has no ` +
                `matching Model passed to start({ models }) — ignored.`,
            );
          }
        });

        selfAndDescendants(node, `[${CONTAINER}]`).forEach((container) => {
          if (container.isConnected) renderContainer(container, modelClasses);
        });
      }
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });

  return {
    addModels(newModelClasses) {
      registerModels(newModelClasses);
    },
  };
};
