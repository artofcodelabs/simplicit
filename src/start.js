const start = (arg = document) => {
  // Support both start(root) and start({ root, components })
  const hasOptions =
    arg && typeof arg === "object" && ("root" in arg || "components" in arg);
  const providedRoot = hasOptions ? (arg.root ?? document) : arg;
  const componentClasses =
    hasOptions && Array.isArray(arg.components) ? arg.components : [];
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
    // Determine the component name to match
    const inferredName =
      typeof ComponentClass.name === "string"
        ? ComponentClass.name.toLowerCase()
        : null;
    const componentName =
      ComponentClass.component || ComponentClass.componentName || inferredName;
    if (!componentName) continue;

    const selector = `[data-component="${componentName}"]`;
    const matches = Array.from(searchRoot.querySelectorAll(selector));
    if (
      searchRoot instanceof Element &&
      searchRoot.getAttribute("data-component") === componentName
    ) {
      matches.unshift(searchRoot);
    }

    for (const el of matches) {
      const instance = new ComponentClass();
      instance.element = el;
      if (typeof instance.connect === "function") instance.connect();
    }
  }

  return components;
};

export default start;
