export const warnMissingStaticName = (ComponentClass) => {
  const ctorName =
    ComponentClass &&
    ComponentClass.prototype &&
    ComponentClass.prototype.constructor
      ? ComponentClass.prototype.constructor.name
      : "(anonymous)";

  console.warn(
    `Component class ${ctorName} passed to start({ components }) should implement static "name"`,
  );
};

export const warnMissingDomComponents = (
  componentElements,
  componentClasses,
) => {
  if (!componentElements || componentElements.length === 0) return;

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
      console.warn(
        `Found data-component="${name}" but no matching class passed to start({ components })`,
      );
    }
  }
};
