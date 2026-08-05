import { NAMESPACE, CONTROLLER, ACTION } from "./attributes.js";

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

const getController = (Controllers, pathSegments) => {
  const resource = pathSegments.reduce((cur, seg) => cur?.[seg], Controllers);
  if (typeof resource === "function") return new resource();
  if (typeof resource === "object" && resource !== null) return resource;
  return null;
};

const init = (Controllers) => {
  const body = document.body;
  const namespacePath = parseNamespacePath(body.getAttribute(NAMESPACE));
  const controllerName = body.getAttribute(CONTROLLER);
  const actionName = body.getAttribute(ACTION);

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
