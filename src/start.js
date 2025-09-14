import { buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initializeMatches } from "./start/init";
import { ensureObservation } from "./start/observer";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);
  initializeMatches(nodes, componentClasses);
  ensureObservation(searchRoot, componentClasses);
  const components = [];
  components.push(...nodes.filter((n) => n.parent === null));
  return components;
};

export default start;
