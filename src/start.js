import { buildElementTree } from "./start/scan.js";
import { validate } from "./start/validate.js";
import { initMatches } from "./start/init.js";
import { observe } from "./start/observe.js";
import { observeScripts } from "./start/observeScripts.js";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = [...(options.components ?? [])];

  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);

  const instances = initMatches(nodes, componentClasses);
  const observer = observe(searchRoot, componentClasses);
  const scriptObserver = observeScripts(searchRoot, componentClasses);
  const roots = instances.filter((i) => i.node.parent === null);

  return {
    roots: roots,
    addComponents(newComponents) {
      const filteredNewComponents = newComponents.filter(
        (ComponentClass) =>
          typeof ComponentClass === "function" &&
          !componentClasses.includes(ComponentClass),
      );
      if (filteredNewComponents.length === 0) return null;

      componentClasses.push(...filteredNewComponents);
      const updatedNodes = buildElementTree(searchRoot);
      validate(updatedNodes, componentClasses);

      const newInstances = observer.addComponents(filteredNewComponents);
      scriptObserver.addComponents(filteredNewComponents);
      return newInstances;
    },
  };
};

export default start;
