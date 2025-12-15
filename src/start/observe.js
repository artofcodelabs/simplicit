import { dataComponentAttribute } from "./config";
import { initComponent, extendElement } from "./init";
import { createNode } from "./node";

const instancesForElements = (elements, classByName) => {
  const instances = new Array();
  for (const el of elements) {
    const name = el.getAttribute(dataComponentAttribute);
    const ComponentClass = classByName.get(name);
    if (!ComponentClass) continue;

    const node = createNode(el);
    const instance = initComponent(node, ComponentClass);
    extendElement(el, instance);
    instances.push(instance);
  }
  return instances;
};

const filterElements = (elements, classByName) => {
  return Array.from(elements).filter((el) => {
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
        .querySelectorAll(`[${dataComponentAttribute}]`)
        .forEach((el) => added.add(el));
    }
  }
  return added;
};

const removedElements = (mutations) => {
  const removed = new Set();
  for (const m of mutations) {
    for (const node of m.removedNodes) {
      if (!(node instanceof Element)) continue;

      if (node.hasAttribute(dataComponentAttribute)) removed.add(node);
      node
        .querySelectorAll(`[${dataComponentAttribute}]`)
        .forEach((el) => removed.add(el));
    }
  }
  return removed;
};

const existingElements = (searchRoot) => {
  const elements = new Set();
  if (searchRoot instanceof Element) {
    if (searchRoot.hasAttribute(dataComponentAttribute)) {
      elements.add(searchRoot);
    }
  }
  if (typeof searchRoot.querySelectorAll === "function") {
    searchRoot
      .querySelectorAll(`[${dataComponentAttribute}]`)
      .forEach((el) => elements.add(el));
  }
  return elements;
};

const linkInstances = (instances) => {
  for (const instance of instances) {
    // Link to parent instances (if any) and update children relationships.
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

  // After parent/child links are established, update siblings for all
  // parents that gained new children in this batch.
  const parentsToUpdate = new Set();
  for (const instance of instances) {
    if (instance.node.parent) {
      parentsToUpdate.add(instance.node.parent);
    }
  }
  for (const parentNode of parentsToUpdate) {
    const children = parentNode.children;
    for (const childNode of children) {
      childNode.siblings = children.filter((n) => n !== childNode);
    }
  }

  for (const instance of instances) {
    if (typeof instance.connect === "function") instance.connect();
  }
};

export const observe = (searchRoot, componentClasses = []) => {
  const classByName = new Map();

  const addComponents = (newComponentClasses = []) => {
    for (const ComponentClass of newComponentClasses) {
      if (!ComponentClass || typeof ComponentClass !== "function") continue;
      classByName.set(ComponentClass.name, ComponentClass);
    }
    const existing = existingElements(searchRoot);
    const filtered = filterElements(existing, classByName);
    if (filtered.length === 0) return [];

    const instances = instancesForElements(filtered, classByName);
    linkInstances(instances);
    return instances;
  };

  const observer = new MutationObserver((mutations) => {
    const removed = removedElements(mutations);
    if (removed.size > 0) {
      for (const el of removed) el.instance?.disconnect();
    }

    const added = addedElements(mutations);
    if (added.size === 0) return;

    const filtered = filterElements(added, classByName);
    if (filtered.length === 0) return;

    const instances = instancesForElements(filtered, classByName);
    linkInstances(instances);
  });

  observer.observe(searchRoot, { childList: true, subtree: true });

  if (componentClasses.length > 0) {
    addComponents(componentClasses);
  }

  return {
    addComponents,
  };
};
