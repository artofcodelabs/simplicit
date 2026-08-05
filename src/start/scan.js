import { COMPONENT } from "../attributes.js";

export const createNode = (element) => ({
  name: element.getAttribute(COMPONENT),
  element,
  parent: null,
  children: [],
  siblings: [],
});

export const linkSiblings = (nodes) => {
  for (const node of nodes) node.siblings = nodes.filter((n) => n !== node);
};

const scanComponentElements = (searchRoot) => {
  const componentElements = Array.from(
    searchRoot.querySelectorAll(`[${COMPONENT}]`),
  ).filter((el) => el.tagName !== "SCRIPT");
  if (
    searchRoot instanceof Element &&
    searchRoot.hasAttribute(COMPONENT) &&
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
    const parentElement = element.parentElement?.closest(`[${COMPONENT}]`);
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
  for (const group of groupByParent.values()) linkSiblings(group);

  return nodes;
};
