import { generateComponentId } from "./id";

export const initializeMatches = (elementToNode, componentClasses) => {
  for (const ComponentClass of componentClasses) {
    for (const node of elementToNode.values()) {
      if (node.name != ComponentClass.name) continue;

      const instance = new ComponentClass();
      instance.element = node.element;
      const sanitizedNode = { ...node };
      delete sanitizedNode.name;
      delete sanitizedNode.element;
      instance.node = sanitizedNode;
      instance.componentId = generateComponentId();
      node.element.setAttribute("data-component-id", instance.componentId);
      node.element.instance = instance;
      if (typeof instance.connect === "function") instance.connect();
    }
  }
};
