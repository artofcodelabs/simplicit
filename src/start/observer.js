import { generateComponentId } from "./id";
import { dataComponentAttribute } from "./config";

const rootToObserver = new WeakMap(); // Element -> { observer, classByName }

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

    const elementToInstance = new Map();
    for (const el of candidates) {
      const name = el.getAttribute(dataComponentAttribute);
      const ComponentClass = classByName.get(name);
      if (!ComponentClass) continue;
      const instance = new ComponentClass();
      instance.element = el;
      instance.node = { parent: null, children: [] };
      instance.componentId = generateComponentId();
      el.setAttribute("data-component-id", instance.componentId);
      el.instance = instance;
      elementToInstance.set(el, instance);
    }

    for (const el of candidates) {
      const instance = elementToInstance.get(el);
      if (!instance) continue;
      const parentEl = el.parentElement?.closest(`[${dataComponentAttribute}]`);
      if (parentEl) {
        const parentInstance =
          elementToInstance.get(parentEl) || parentEl.instance;
        if (parentInstance && parentInstance.node) {
          instance.node.parent = parentInstance.node;
          parentInstance.node.children.push(instance.node);
        }
      }
      for (const child of candidates) {
        if (child === el) continue;
        const nearest = child.parentElement?.closest(
          `[${dataComponentAttribute}]`,
        );
        if (nearest === el) {
          const childInstance = elementToInstance.get(child);
          if (childInstance) {
            instance.node.children.push(childInstance.node);
            childInstance.node.parent = instance.node;
          }
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
