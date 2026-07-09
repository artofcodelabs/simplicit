import { load, loadModelScript } from "./load.js";
import { render, renderAnchor, representationFor } from "./render.js";

const representationNames = (modelClasses) =>
  new Set(modelClasses.flatMap((m) => m.components ?? []).map((c) => c.name));

const isModelScript = (node) =>
  node instanceof HTMLScriptElement &&
  node.type === "application/json" &&
  node.hasAttribute("data-model");

const isAnchorScript = (node, names) =>
  node instanceof HTMLScriptElement &&
  node.type === "application/json" &&
  node.hasAttribute("data-component") &&
  names.has(node.dataset.component);

const scriptsIn = (node, selector, predicate) => {
  const out = [];
  if (predicate(node)) out.push(node);
  node.querySelectorAll?.(selector)?.forEach((s) => {
    if (predicate(s)) out.push(s);
  });
  return out;
};

export const observeModels = (searchRoot, modelClasses) => {
  const modelNames = new Set(modelClasses.map((m) => m.name));
  const names = representationNames(modelClasses);

  load(searchRoot, modelClasses);
  render(searchRoot, modelClasses);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        scriptsIn(
          node,
          "script[type='application/json'][data-model]",
          (n) => isModelScript(n) && n.isConnected,
        ).forEach((s) => {
          if (modelNames.has(s.dataset.model)) {
            loadModelScript(s, modelClasses);
          } else {
            console.warn(
              `[simplicit] <script data-model="${s.dataset.model}"> has no ` +
                `matching Model passed to start({ models }) — ignored.`,
            );
          }
        });

        scriptsIn(
          node,
          "script[type='application/json'][data-component]",
          (n) => isAnchorScript(n, names) && n.isConnected,
        ).forEach((a) =>
          renderAnchor(a, representationFor(a.dataset.component, modelClasses)),
        );
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
