const dataComponentAttribute = "data-component";

export const scanComponentElements = (searchRoot) => {
  const componentElements = Array.from(
    searchRoot.querySelectorAll(`[${dataComponentAttribute}]`),
  );
  if (
    searchRoot instanceof Element &&
    searchRoot.hasAttribute(dataComponentAttribute) &&
    !componentElements.includes(searchRoot)
  ) {
    componentElements.unshift(searchRoot);
  }
  return componentElements;
};

export const buildElementTree = (componentElements) => {
  const elementToNode = new Map();
  for (const element of componentElements) {
    const name = element.getAttribute(dataComponentAttribute);
    elementToNode.set(element, {
      name,
      element,
      parent: null,
      children: [],
    });
  }
  for (const element of componentElements) {
    const node = elementToNode.get(element);
    const parentElement = element.parentElement?.closest(
      `[${dataComponentAttribute}]`,
    );
    if (parentElement && elementToNode.has(parentElement)) {
      const parentNode = elementToNode.get(parentElement);
      node.parent = parentNode;
      parentNode.children.push(node);
    }
  }
  return elementToNode;
};
