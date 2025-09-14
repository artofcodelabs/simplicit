import { generateComponentId } from "./id";

export const initializeMatches = (nodes, componentClasses) => {
  for (const ComponentClass of componentClasses) {
    for (const node of nodes) {
      if (node.name != ComponentClass.name) continue;

      const instance = new ComponentClass();
      instance.element = node.element;
      const { parent, children } = { ...node };
      instance.node = { parent, children };
      instance.componentId = generateComponentId();

      node.element.setAttribute("data-component-id", instance.componentId);
      node.element.instance = instance;

      if (typeof instance.connect === "function") instance.connect();
    }
  }
};
