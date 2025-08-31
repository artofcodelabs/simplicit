const start = (root = document) => {
  console.log(">>> start");
  // Build a fresh components tree on every call
  const components = [];

  // Determine the search root (document.body if a Document is provided)
  const searchRoot = root && root.body ? root.body : root;

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

  console.log(components);
  return components;
};

export default start;
