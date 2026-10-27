import { COMPONENT } from "../attributes.js";
import { initComponent, extendElement } from "./init.js";
import { createNode, linkSiblings } from "./scan.js";

const isScriptElement = (el) => el.tagName === "SCRIPT";

const validNode = (node) =>
  !isScriptElement(node) && node.hasAttribute(COMPONENT);

const instancesForElements = (elements, classByName) => {
  const instances = [];
  for (const el of elements) {
    const ComponentClass = classByName.get(el.getAttribute(COMPONENT));
    if (!ComponentClass) continue;

    const instance = initComponent(createNode(el), ComponentClass);
    extendElement(el, instance);
    instances.push(instance);
  }
  return instances;
};

const filterElements = (elements, classByName) => {
  return Array.from(elements).filter((el) => {
    if (isScriptElement(el)) return false;
    const name = el.getAttribute(COMPONENT);
    return classByName.has(name) && !el.instance;
  });
};

// key is "addedNodes" or "removedNodes".
const mutatedElements = (mutations, key) => {
  const found = new Set();
  for (const m of mutations) {
    for (const node of m[key]) {
      if (!(node instanceof Element)) continue;

      if (validNode(node)) found.add(node);
      node.querySelectorAll(`[${COMPONENT}]`).forEach((el) => {
        if (!isScriptElement(el)) found.add(el);
      });
    }
  }
  return found;
};

const existingElements = (searchRoot) => {
  const elements = new Set();
  if (searchRoot instanceof Element) {
    if (validNode(searchRoot)) elements.add(searchRoot);
  }
  if (typeof searchRoot.querySelectorAll === "function") {
    searchRoot.querySelectorAll(`[${COMPONENT}]`).forEach((el) => {
      if (!isScriptElement(el)) elements.add(el);
    });
  }
  return elements;
};

const linkInstances = (instances) => {
  for (const instance of instances) {
    // Link to parent instances (if any) and update children relationships.
    const parentEl = instance.element.parentElement?.closest(`[${COMPONENT}]`);
    if (parentEl?.instance) {
      instance.addParent(parentEl.instance);
    }
    for (const childInstance of instances) {
      if (childInstance.element === instance.element) continue;

      const nearest = childInstance.element.parentElement?.closest(
        `[${COMPONENT}]`,
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
    if (instance.node.parent) parentsToUpdate.add(instance.node.parent);
  }
  for (const parentNode of parentsToUpdate) linkSiblings(parentNode.children);

  for (const instance of instances) {
    if (typeof instance.connect === "function") instance.connect();
  }
  for (const instance of instances) {
    instance.connectModel();
  }
};

export const observe = (searchRoot, componentClasses = []) => {
  const classByName = new Map();

  const addComponents = (newComponentClasses = []) => {
    for (const ComponentClass of newComponentClasses) {
      classByName.set(ComponentClass.name, ComponentClass);
    }
    const filtered = filterElements(existingElements(searchRoot), classByName);
    if (filtered.length === 0) return [];

    const instances = instancesForElements(filtered, classByName);
    linkInstances(instances);
    return instances;
  };

  const observer = new MutationObserver((mutations) => {
    for (const el of mutatedElements(mutations, "removedNodes")) {
      el.instance?.disconnect();
    }

    const filtered = filterElements(
      mutatedElements(mutations, "addedNodes"),
      classByName,
    );
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
