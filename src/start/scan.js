export const scanComponentElements = (searchRoot) => {
  const componentElements = Array.from(
    searchRoot.querySelectorAll("[data-component]"),
  );
  if (
    searchRoot instanceof Element &&
    searchRoot.hasAttribute("data-component") &&
    !componentElements.includes(searchRoot)
  ) {
    componentElements.unshift(searchRoot);
  }
  return componentElements;
};

export const buildElementTree = (componentElements) => {
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
  for (const element of componentElements) {
    const node = elementToNode.get(element);
    const parentElement = element.parentElement?.closest("[data-component]");
    if (parentElement && elementToNode.has(parentElement)) {
      const parentNode = elementToNode.get(parentElement);
      node.parent = parentNode;
      parentNode.children.push(node);
    }
  }
  return elementToNode;
};
