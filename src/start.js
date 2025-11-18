import { buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initMatches } from "./start/init";
import { observe } from "./start/observe";

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
  return roots.length === 1 ? roots[0] : roots;
};

export default start;
