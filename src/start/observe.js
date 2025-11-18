import { dataComponentAttribute } from "./config";
import { initComponent, extendElement } from "./init";

const instancesForElements = (elements, classByName) => {
  const instances = new Array();
  for (const el of elements) {
    const name = el.getAttribute(dataComponentAttribute);
    const ComponentClass = classByName.get(name);
    if (!ComponentClass) continue;

    const node = { element: el, parent: null, siblings: [], children: [] };
    const instance = initComponent(node, ComponentClass);
    extendElement(el, instance);
    instances.push(instance);
  }
  return instances;
};

const filterElements = (added, classByName) => {
  return Array.from(added).filter((el) => {
    const name = el.getAttribute(dataComponentAttribute);
    return classByName.has(name) && !el.instance;
  });
};

const addedElements = (mutations) => {
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

export const observe = (searchRoot, componentClasses) => {
  const classByName = new Map();
  for (const ComponentClass of componentClasses) {
    classByName.set(ComponentClass.name, ComponentClass);
  }

  const observer = new MutationObserver((mutations) => {
    const added = addedElements(mutations);
    if (added.size === 0) return;

    const filtered = filterElements(added, classByName);
    if (filtered.length === 0) return;

    const instances = instancesForElements(filtered, classByName);

    for (const instance of instances) {
      const parentEl = instance.element.parentElement?.closest(
        `[${dataComponentAttribute}]`,
      );
      if (parentEl) {
        const parentInstance = parentEl.instance;
        if (parentInstance) {
          instance.addParent(parentInstance);
        }
      }
      for (const childInstance of instances) {
        if (childInstance.element === instance.element) continue;

        const nearest = childInstance.element.parentElement?.closest(
          `[${dataComponentAttribute}]`,
        );
        if (nearest === instance.element) {
          instance.node.children.push(childInstance.node);
          childInstance.node.parent = instance.node;
        }
      }
    }

    for (const instance of instances) {
      if (typeof instance.connect === "function") instance.connect();
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });
};
