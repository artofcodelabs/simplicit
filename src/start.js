import { warnMissingDomComponents } from "./start/warnings";

import {
  resolveSearchRoot,
  scanComponentElements,
  buildElementTree,
} from "./start/scan";
import { initializeMatches } from "./start/init";
import { ensureObservation } from "./start/observer";

const start = (options = {}) => {
  const providedRoot = options.root ?? document;
  const componentClasses = Array.isArray(options.components)
    ? options.components
    : [];
  // Build a fresh components tree on every call
  const components = [];

  // Determine the search root (document.body if a Document is provided)
  const searchRoot = resolveSearchRoot(providedRoot);

  // Find all component elements within the search root
  const componentElements = scanComponentElements(searchRoot);

  // Create a node for each element upfront so parent/child linking doesn't depend on order
  const { elementToNode } = buildElementTree(componentElements);
  // roots are not needed from here; tests expect return to be an array of root nodes
  components.push(
    ...Array.from(elementToNode.values()).filter((n) => n.parent === null),
  );

  // Initialize provided component classes (if any)
  // Initialize instances for matching nodes
  initializeMatches(elementToNode, componentClasses);

  warnMissingDomComponents(componentElements, componentClasses);

  // Begin observing for dynamically added components within this root
  ensureObservation(searchRoot, componentClasses);

  return components;
};

export default start;
