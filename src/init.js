import { NAMESPACE, CONTROLLER, ACTION } from "./attributes.js";

// active resources, outer → inner: namespace levels, then the controller
let chain = [];

const callFunc = (resource, name) => {
  if (typeof resource.constructor[name] === "function") {
    resource.constructor[name]();
  }
  if (typeof resource[name] === "function") {
    resource[name]();
  }
};

const parseNamespacePath = (string) =>
  (string ?? "").split("/").filter(Boolean);

const getController = (Controllers, pathSegments) => {
  if (pathSegments.length === 0) return null;
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

  // inner → outer
  chain.reverse().forEach((resource) => callFunc(resource, "deinitialize"));

  // one instance per namespace level, outer → inner; all-or-nothing
  let namespaces = namespacePath.map((_, i) =>
    getController(Controllers, namespacePath.slice(0, i + 1)),
  );
  if (namespaces.includes(null)) namespaces = [];

  const namespaceController = namespaces[0] ?? null;
  const controller = getController(
    Controllers,
    namespaces.length ? [...namespacePath, controllerName] : [controllerName],
  );
  chain = [...namespaces, controller].filter((resource) => resource !== null);

  chain.forEach((resource) => {
    if (resource !== namespaceController)
      resource.namespaceController = namespaceController;
    if (resource !== controller) resource.controller = controller;
  });
  chain.forEach((resource) => callFunc(resource, "initialize"));
  if (controller !== null) callFunc(controller, actionName);

  // copy: chain is reversed in place on next init
  return {
    namespaceController,
    controller,
    controllers: [...chain],
    action: actionName,
  };
};

export default init;
