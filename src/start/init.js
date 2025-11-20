import { generateComponentId } from "./id";

export const initComponent = (node, ComponentClass) => {
  const instance = new ComponentClass();
  instance.node = node;
  instance.componentId = generateComponentId();
  return instance;
};

export const extendElement = (element, instance) => {
  element.setAttribute("data-component-id", instance.componentId);
  element.instance = instance;
};

export const initMatches = (nodes, componentClasses) => {
  const instances = [];
  for (const ComponentClass of componentClasses) {
    for (const node of nodes) {
      if (node.name != ComponentClass.name) continue;

      const instance = initComponent(node, ComponentClass);
      extendElement(node.element, instance);
      instances.push(instance);
    }
  }
  for (const instance of instances) {
    if (typeof instance.connect === "function") instance.connect();
  }
  return instances;
};
