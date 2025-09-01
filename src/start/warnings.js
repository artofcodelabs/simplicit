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

export const warnMissingComponentClass = (componentName) => {
  console.warn(
    `Found data-component="${componentName}" but no matching class passed to start({ components })`,
  );
};
