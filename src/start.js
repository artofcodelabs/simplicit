import { warnMissingDomComponents } from "./start/warnings";

import { scanComponentElements, buildElementTree } from "./start/scan";
import { initializeMatches } from "./start/init";
import { ensureObservation } from "./start/observer";

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  // TODO: validate componentClasses
  const componentElements = scanComponentElements(searchRoot);
  warnMissingDomComponents(componentElements, componentClasses);
  const elementToNode = buildElementTree(componentElements);
  initializeMatches(elementToNode, componentClasses);
  ensureObservation(searchRoot, componentClasses);
  const components = [];
  components.push(
    ...Array.from(elementToNode.values()).filter((n) => n.parent === null),
  );
  return components;
};

export default start;
