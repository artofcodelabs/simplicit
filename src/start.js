import { scanComponentElements, buildElementTree } from "./start/scan";
import { validate } from "./start/validate";
import { initializeMatches } from "./start/init";
import { ensureObservation } from "./start/observer";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  const componentElements = scanComponentElements(searchRoot);
  const elementToNode = buildElementTree(componentElements);
  validate(elementToNode, componentClasses);
  initializeMatches(elementToNode, componentClasses);
  ensureObservation(searchRoot, componentClasses);
  const components = [];
  components.push(
    ...Array.from(elementToNode.values()).filter((n) => n.parent === null),
  );
  return components;
};

export default start;
