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
  initMatches(nodes, componentClasses);
  observe(searchRoot, componentClasses);
  // TODO: initMatches should return instances
  const roots = nodes.filter((n) => n.parent === null);
  const instances = roots.map((n) => n.element.instance);
  return instances.length === 1 ? instances[0] : instances;
};

export default start;
