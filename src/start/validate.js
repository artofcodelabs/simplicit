export const validate = (componentElements, componentClasses) => {
  if (componentElements.length === 0) {
    throw new Error("No component elements found in the root element");
  }
  for (const C of componentClasses) {
    const ctorName =
      C.prototype?.constructor?.name || C.constructor?.name || "(anonymous)";
    const desc = Object.getOwnPropertyDescriptor(C, "name");
    if (
      typeof C.name !== "string" ||
      C.name.length === 0 ||
      !desc ||
      desc.writable !== true
    ) {
      throw new Error(
        `Invalid component class: missing static name (${ctorName})`,
      );
    }
  }
  const domNames = new Set(
    Array.from(componentElements, (el) => el.getAttribute("data-component")),
  );
  const providedNames = new Set(
    (Array.isArray(componentClasses) ? componentClasses : [])
      .map((C) => (typeof C?.name === "string" ? C.name : null))
      .filter(Boolean),
  );
  for (const name of domNames) {
    if (!providedNames.has(name)) {
      throw new Error(
        `Found data-component="${name}" but no matching class passed to start({ components })`,
      );
    }
  }
};
