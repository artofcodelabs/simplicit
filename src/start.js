import { buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initMatches } from "./start/init";
import { observe } from "./start/observe";
import { destructArray } from "./start/helpers";

// TODO: be able to add component classes after start() has been called
const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);
  const instances = initMatches(nodes, componentClasses);
  observe(searchRoot, componentClasses);
  const roots = instances.filter((i) => i.node.parent === null);
  return destructArray(roots);
};

export default start;
