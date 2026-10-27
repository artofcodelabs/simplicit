import { COMPONENT } from "../attributes.js";

export const validate = (nodes, componentClasses) => {
  for (const C of componentClasses) {
    const desc = Object.getOwnPropertyDescriptor(C, "name");
    if (
      typeof C.name !== "string" ||
      C.name.length === 0 ||
      !desc ||
      desc.writable !== true
    ) {
      throw new Error(
        `Invalid component class: missing static name (${C.name || "(anonymous)"})`,
      );
    }
  }
  const domNames = new Set(nodes.map((n) => n.name));
  const providedNames = new Set(componentClasses.map((C) => C.name));
  for (const name of domNames) {
    if (!providedNames.has(name)) {
      throw new Error(
        `Found ${COMPONENT}="${name}" but no matching class passed to start({ components })`,
      );
    }
  }
};
