import { dataComponentAttribute } from "./config";
import { initComponent, extendElement } from "./init";

const rootToObserver = new WeakMap(); // Element -> { observer, classByName }

const buildElementToInstance = (candidates, classByName) => {
  const elementToInstance = new Map();
  for (const el of candidates) {
    const name = el.getAttribute(dataComponentAttribute);
    const ComponentClass = classByName.get(name);
    if (!ComponentClass) continue;

    const node = { element: el, parent: null, children: [] };
    const instance = initComponent(node, ComponentClass);
    extendElement(el, instance);
    elementToInstance.set(el, instance);
  }
  return elementToInstance;
};

const filterAdded = (added, classByName) => {
  return Array.from(added).filter((el) => {
    const name = el.getAttribute(dataComponentAttribute);
    return classByName.has(name) && !el.instance;
  });
};

const addedNodes = (mutations) => {
  const added = new Set();
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof Element)) continue;

      if (node.hasAttribute(dataComponentAttribute)) added.add(node);
      node
        .querySelectorAll?.(`[${dataComponentAttribute}]`)
        .forEach((el) => added.add(el));
    }
  }
  return added;
};

export const ensureObservation = (searchRoot, componentClasses) => {
  const classByName = new Map();
  for (const ComponentClass of componentClasses) {
    classByName.set(ComponentClass.name, ComponentClass);
  }

  const observer = new MutationObserver((mutations) => {
    const added = addedNodes(mutations);
    if (added.size === 0) return;

    const candidates = filterAdded(added, classByName);
    if (candidates.length === 0) return;

    const elementToInstance = buildElementToInstance(candidates, classByName);

    for (const [el, instance] of elementToInstance) {
      const parentEl = el.parentElement?.closest(`[${dataComponentAttribute}]`);
      if (parentEl) {
        const parentInstance = parentEl.instance;
        if (parentInstance) {
          instance.addParent(parentInstance);
        }
      }
      for (const [childEl, childInstance] of elementToInstance) {
        if (childEl === el) continue;
        const nearest = childEl.parentElement?.closest(
          `[${dataComponentAttribute}]`,
        );
        if (nearest === el) {
          instance.node.children.push(childInstance.node);
          childInstance.node.parent = instance.node;
        }
      }
    }

    for (const instance of elementToInstance.values()) {
      if (typeof instance.connect === "function") instance.connect();
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });
  rootToObserver.set(searchRoot, { observer, classByName });
};
