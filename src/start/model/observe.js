import { CONTAINER, MODEL } from "../../attributes.js";
import { selfAndDescendants } from "../helpers.js";
import { load, loadModelScript, MODEL_SCRIPT_SELECTOR } from "./load.js";
import { render, renderContainer, renderContainers } from "./render.js";

// A page's snapshots all come from one server render, so hydration is one
// event even when it arrives as several scripts. Batch them into a microtask
// and report the oldest `as_of`, so a caller reconciling against the snapshot
// never assumes more than the earliest of them knew.
const reportHydration = (onHydrate) => {
  const pending = [];
  const older = (a, b) => (Date.parse(b) < Date.parse(a) ? b : a);

  return (asOfs) => {
    if (onHydrate == null || asOfs.length === 0) return;

    const scheduled = pending.length > 0;
    pending.push(...asOfs);
    if (scheduled) return;

    queueMicrotask(() => {
      const asOf = pending.reduce(older);
      pending.length = 0;
      onHydrate(asOf);
    });
  };
};

export const observeModels = (searchRoot, modelClasses, onHydrate) => {
  const modelNames = new Set();
  const hydrated = reportHydration(onHydrate);

  const registerModels = (newModelClasses) => {
    for (const ModelClass of newModelClasses) {
      modelNames.add(ModelClass.name);
      for (const ComponentClass of ModelClass.components ?? []) {
        ModelClass.onCollectionChange(() =>
          renderContainers(searchRoot, ComponentClass, modelClasses),
        );
      }
    }
    hydrated(load(searchRoot, modelClasses));
    render(searchRoot, modelClasses);
  };

  registerModels(modelClasses);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        selfAndDescendants(node, MODEL_SCRIPT_SELECTOR).forEach((s) => {
          if (!s.isConnected) return;
          if (modelNames.has(s.getAttribute(MODEL))) {
            hydrated(
              [loadModelScript(s, modelClasses)].filter((a) => a != null),
            );
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
