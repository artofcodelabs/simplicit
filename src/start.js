import {
  warnMissingStaticName,
  warnMissingDomComponents,
} from "./start/warnings";

let componentIdCounter = 1;
const generateComponentId = () => `${componentIdCounter++}`;

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

  return components;
};

export default start;
