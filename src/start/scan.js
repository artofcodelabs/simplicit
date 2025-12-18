import { dataComponentAttribute } from "./config";
import { createNode } from "./node";

const scanComponentElements = (searchRoot) => {
  const componentElements = Array.from(
    searchRoot.querySelectorAll(`[${dataComponentAttribute}]`),
  ).filter((el) => el.tagName !== "SCRIPT");
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
  const nodes = componentElements.map((element) => createNode(element));

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

  const groupByParent = new Map();
  for (const node of nodes) {
    const key = node.parent ?? null;
    if (!groupByParent.has(key)) groupByParent.set(key, []);
    groupByParent.get(key).push(node);
  }

  for (const group of groupByParent.values()) {
    for (const node of group) {
      node.siblings = group.filter((n) => n !== node);
    }
  }

  return nodes;
};
