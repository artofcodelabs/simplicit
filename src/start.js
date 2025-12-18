import { buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initMatches } from "./start/init";
import { observe } from "./start/observe";
import { observeScripts } from "./start/observeScripts";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = [...(options.components ?? [])];

  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);

  const instances = initMatches(nodes, componentClasses);
  const observer = observe(searchRoot, componentClasses);
  const roots = instances.filter((i) => i.node.parent === null);

  observeScripts(searchRoot, componentClasses);

  return {
    roots: roots,
    components: componentClasses,
    addComponents(newComponents) {
      if (newComponents.length === 0) return null;

      for (const ComponentClass of newComponents) {
        if (!componentClasses.includes(ComponentClass)) {
          componentClasses.push(ComponentClass);
        }
      }
      const updatedNodes = buildElementTree(searchRoot);
      validate(updatedNodes, componentClasses);

      return observer.addComponents(newComponents);
    },
  };
};

export default start;
