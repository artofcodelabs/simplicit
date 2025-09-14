import { dataComponentAttribute } from "./config";

const scanComponentElements = (searchRoot) => {
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

export const buildElementTree = (searchRoot) => {
  const componentElements = scanComponentElements(searchRoot);
  const nodes = componentElements.map((element) => ({
    name: element.getAttribute(dataComponentAttribute),
    element,
    parent: null,
    children: [],
  }));

  const elementToNode = new Map();
  for (const node of nodes) elementToNode.set(node.element, node);

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
  return nodes;
};
