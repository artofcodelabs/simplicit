import { generateComponentId } from "./id";

const initComponent = (node, ComponentClass) => {
  const instance = new ComponentClass();
  instance.element = node.element;
  const { parent, children } = { ...node };
  instance.node = { parent, children };
  instance.componentId = generateComponentId();
  return instance;
};

const extendElement = (element, instance) => {
  element.setAttribute("data-component-id", instance.componentId);
  element.instance = instance;
};

export const initMatches = (nodes, componentClasses) => {
  for (const ComponentClass of componentClasses) {
    for (const node of nodes) {
      if (node.name != ComponentClass.name) continue;

      const instance = initComponent(node, ComponentClass);
      extendElement(node.element, instance);
      if (typeof instance.connect === "function") instance.connect();
    }
  }
};
