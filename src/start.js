import { buildElementTree } from "./start/scan.js";
import { validate } from "./start/validate.js";
import { initMatches } from "./start/init.js";
import { observe } from "./start/observe.js";
import { observeScripts } from "./start/observeScripts.js";
import { observeModels } from "./start/model/observe.js";
import { wireAssociations } from "./start/model/associations.js";

const wireModelComponents = (models, componentClasses) => {
  wireAssociations(models);
  const newComponents = [];
  for (const ModelClass of models) {
    for (const ComponentClass of ModelClass.components ?? []) {
      ComponentClass.Model = ModelClass;
      if (!componentClasses.includes(ComponentClass)) {
        componentClasses.push(ComponentClass);
        newComponents.push(ComponentClass);
      }
    }
  }
  return newComponents;
};

const start = (options = {}) => {
  const searchRoot = options.root ?? document.body;
  const componentClasses = [...(options.components ?? [])];
  const modelClasses = [...(options.models ?? [])];

  wireModelComponents(modelClasses, componentClasses);

  const nodes = buildElementTree(searchRoot);
  validate(nodes, componentClasses);
  const modelObserver = observeModels(searchRoot, modelClasses);
  const instances = initMatches(nodes, componentClasses);
  const observer = observe(searchRoot, componentClasses);
  const scriptObserver = observeScripts(searchRoot, componentClasses);
  const roots = instances.filter((i) => i.node.parent === null);

  const registerComponents = (newComponents) => {
    const updatedNodes = buildElementTree(searchRoot);
    validate(updatedNodes, componentClasses);

    const newInstances = observer.addComponents(newComponents);
    scriptObserver.addComponents(newComponents);
    return newInstances;
  };

  return {
    roots,
    addComponents(newComponents) {
      const filteredNewComponents = newComponents.filter(
        (ComponentClass) =>
          typeof ComponentClass === "function" &&
          !componentClasses.includes(ComponentClass),
      );
      if (filteredNewComponents.length === 0) return null;

      componentClasses.push(...filteredNewComponents);
      return registerComponents(filteredNewComponents);
    },
    addModels(newModels) {
      const filteredNewModels = newModels.filter(
        (ModelClass) =>
          typeof ModelClass === "function" &&
          !modelClasses.includes(ModelClass),
      );
      if (filteredNewModels.length === 0) return null;

      modelClasses.push(...filteredNewModels);
      const newComponents = wireModelComponents(
        filteredNewModels,
        componentClasses,
      );
      modelObserver.addModels(filteredNewModels);
      return registerComponents(newComponents);
    },
  };
};

export default start;
