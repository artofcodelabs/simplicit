// TODO: split on smaller files

import {
  warnMissingStaticName,
  warnMissingDomComponents,
} from "./start/warnings";

let componentIdCounter = 1;
const generateComponentId = () => `${componentIdCounter++}`;

// Track observers and registered components per root so we can auto-initialize
// dynamically added component elements without duplicating observers.
const rootToObserver = new WeakMap(); // Element -> { observer, classByName }

// TODO: test it
const ensureObservation = (searchRoot, componentClasses) => {
  // Build or extend the class map for this root
  const classByName = new Map();
  if (rootToObserver.has(searchRoot)) {
    const existing = rootToObserver.get(searchRoot);
    existing.classByName.forEach((v, k) => classByName.set(k, v));
  }
  for (const ComponentClass of componentClasses) {
    const name =
      typeof ComponentClass?.name === "string" ? ComponentClass.name : null;
    if (name) classByName.set(name, ComponentClass);
  }

  // If an observer already exists, just update its class map and return
  if (rootToObserver.has(searchRoot)) {
    const entry = rootToObserver.get(searchRoot);
    entry.classByName = classByName;
    return;
  }

  const observer = new MutationObserver((mutations) => {
    const added = new Set();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.hasAttribute("data-component")) added.add(node);
        node
          .querySelectorAll?.("[data-component]")
          .forEach((el) => added.add(el));
      }
    }

    if (added.size === 0) return;

    // Filter to those with matching provided classes and not already initialized
    const candidates = Array.from(added).filter((el) => {
      const name = el.getAttribute("data-component");
      return classByName.has(name) && !el.instance;
    });

    if (candidates.length === 0) return;

    // Stage 1: create instances and basic nodes
    const elementToInstance = new Map();
    for (const el of candidates) {
      const name = el.getAttribute("data-component");
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

    // Stage 2: link parents and children, including external parents
    for (const el of candidates) {
      const instance = elementToInstance.get(el);
      if (!instance) continue;
      const parentEl = el.parentElement?.closest("[data-component]");
      if (parentEl) {
        const parentInstance =
          elementToInstance.get(parentEl) || parentEl.instance;
        if (parentInstance && parentInstance.node) {
          instance.node.parent = parentInstance.node;
          parentInstance.node.children.push(instance.node);
        }
      }
      // Derive children by nearest ancestor logic within the added set
      for (const child of candidates) {
        if (child === el) continue;
        const nearest = child.parentElement?.closest("[data-component]");
        if (nearest === el) {
          const childInstance = elementToInstance.get(child);
          if (childInstance) {
            instance.node.children.push(childInstance.node);
            childInstance.node.parent = instance.node;
          }
        }
      }
    }

    // Stage 3: connect
    for (const instance of elementToInstance.values()) {
      if (typeof instance.connect === "function") instance.connect();
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });
  rootToObserver.set(searchRoot, { observer, classByName });
};

const start = (options = {}) => {
  const providedRoot = options.root ?? document;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  // Build a fresh components tree on every call
  const components = [];

  // Determine the search root (document.body if a Document is provided)
  const searchRoot =
    providedRoot && providedRoot.body ? providedRoot.body : providedRoot;

  // Find all component elements within the search root
  const componentElements = Array.from(
    searchRoot.querySelectorAll("[data-component]"),
  );
  // Include the root itself if it is a component element
  if (
    searchRoot instanceof Element &&
    searchRoot.hasAttribute("data-component") &&
    !componentElements.includes(searchRoot)
  ) {
    componentElements.unshift(searchRoot);
  }

  // Create a node for each element upfront so parent/child linking doesn't depend on order
  const elementToNode = new Map();
  for (const element of componentElements) {
    const name = element.getAttribute("data-component");
    elementToNode.set(element, {
      name,
      element,
      parent: null,
      children: [],
    });
  }

  // Link nodes into a tree based on the nearest ancestor component
  for (const element of componentElements) {
    const node = elementToNode.get(element);
    const parentElement = element.parentElement?.closest("[data-component]");
    if (parentElement && elementToNode.has(parentElement)) {
      const parentNode = elementToNode.get(parentElement);
      node.parent = parentNode;
      parentNode.children.push(node);
    } else {
      components.push(node);
    }
  }

  // Initialize provided component classes (if any)
  for (const ComponentClass of componentClasses) {
    // Determine the component name to match (custom static field 'name' only)
    const componentName =
      typeof ComponentClass?.name === "string" ? ComponentClass.name : null;
    if (!componentName) {
      warnMissingStaticName(ComponentClass);
      continue;
    }

    const matches = [];
    for (const node of elementToNode.values()) {
      if (node.name === componentName) matches.push(node);
    }

    for (const node of matches) {
      const instance = new ComponentClass();
      instance.element = node.element;
      // Attach a sanitized view of the node without name/element keys
      const sanitizedNode = { ...node };
      delete sanitizedNode.name;
      delete sanitizedNode.element;
      instance.node = sanitizedNode;
      instance.componentId = generateComponentId();
      node.element.setAttribute("data-component-id", instance.componentId);
      // Expose the instance on the root element for this component
      node.element.instance = instance;
      if (typeof instance.connect === "function") instance.connect();
    }
  }

  warnMissingDomComponents(componentElements, componentClasses);

  // Begin observing for dynamically added components within this root
  ensureObservation(searchRoot, componentClasses);

  return components;
};

export default start;
