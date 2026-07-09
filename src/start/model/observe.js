import { load, loadModelScript } from "./load.js";
import {
  render,
  renderContainer,
  renderContainers,
  CONTAINER_ATTR,
} from "./render.js";

const isModelScript = (node) =>
  node instanceof HTMLScriptElement &&
  node.type === "application/json" &&
  node.hasAttribute("data-model");

const modelScriptsIn = (node) => {
  const out = [];
  if (isModelScript(node)) out.push(node);
  node
    .querySelectorAll?.("script[type='application/json'][data-model]")
    ?.forEach((s) => out.push(s));
  return out;
};

const containersIn = (node) => {
  const out = [];
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.hasAttribute(CONTAINER_ATTR)
  ) {
    out.push(node);
  }
  node.querySelectorAll?.(`[${CONTAINER_ATTR}]`)?.forEach((el) => out.push(el));
  return out;
};

export const observeModels = (searchRoot, modelClasses) => {
  const modelNames = new Set(modelClasses.map((m) => m.name));

  for (const ModelClass of modelClasses) {
    for (const ComponentClass of ModelClass.components ?? []) {
      ModelClass.onChange(() => renderContainers(searchRoot, ComponentClass));
    }
  }

  load(searchRoot, modelClasses);
  render(searchRoot, modelClasses);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        modelScriptsIn(node).forEach((s) => {
          if (!s.isConnected) return;
          if (modelNames.has(s.dataset.model)) {
            loadModelScript(s, modelClasses);
          } else {
            console.warn(
              `[simplicit] <script data-model="${s.dataset.model}"> has no ` +
                `matching Model passed to start({ models }) — ignored.`,
            );
          }
        });

        containersIn(node).forEach((container) => {
          if (container.isConnected) renderContainer(container, modelClasses);
        });
      }
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });

  return {
    disconnect() {
      observer.disconnect();
    },
  };
};
