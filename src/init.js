let namespaceController = null;
let controller = null;

const callFunc = (resource, name) => {
  if (typeof resource.constructor[name] === "function") {
    resource.constructor[name]();
  }
  if (typeof resource[name] === "function") {
    resource[name]();
  }
};

const parseNamespacePath = (string) => string.split("/").filter(Boolean);

const resolvePath = (controllers, pathSegments) => {
  let cur = controllers;
  for (const seg of pathSegments) {
    cur = cur[seg];
  }
  return cur;
};

const getController = (Controllers, pathSegments) => {
  const resource = resolvePath(Controllers, pathSegments);
  if (typeof resource === "function") return new resource();
  if (typeof resource === "object" && resource !== null) return resource;
  return null;
};

const init = (Controllers) => {
  const body = document.getElementsByTagName("body")[0];
  const namespacePath = parseNamespacePath(body.getAttribute("data-namespace"));
  const controllerName = body.getAttribute("data-controller");
  const actionName = body.getAttribute("data-action");

  if (controller !== null) {
    callFunc(controller, "deinitialize");
    controller = null;
  }
  if (namespaceController !== null) {
    callFunc(namespaceController, "deinitialize");
    namespaceController = null;
  }

  namespaceController = getController(Controllers, namespacePath);
  controller = getController(Controllers, [controllerName]);

  if (namespaceController !== null) {
    controller = getController(Controllers, [...namespacePath, controllerName]);
    namespaceController.controller = controller;
    callFunc(namespaceController, "initialize");
  }
  if (controller !== null) {
    controller.namespaceController = namespaceController;
    callFunc(controller, "initialize");
    callFunc(controller, actionName);
  }

  return { namespaceController, controller, action: actionName };
};

export default init;
