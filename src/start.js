import { buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initMatches } from "./start/init";
import { observe } from "./start/observer";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);
  initMatches(nodes, componentClasses);
  observe(searchRoot, componentClasses);
  return nodes.filter((n) => n.parent === null);
};

export default start;
