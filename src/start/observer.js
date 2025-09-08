import { generateComponentId } from "./id";

const rootToObserver = new WeakMap(); // Element -> { observer, classByName }

export const ensureObservation = (searchRoot, componentClasses) => {
  const classByName = new Map();
  if (rootToObserver.has(searchRoot)) {
    const existing = rootToObserver.get(searchRoot);
    existing.classByName.forEach((v, k) => classByName.set(k, v));
  }
  for (const ComponentClass of componentClasses) {
    const name =
      typeof ComponentClass?.name === "string" ? ComponentClass.name : null;
    if (name) classByName.set(name, ComponentClass);
  }

  if (rootToObserver.has(searchRoot)) {
    const entry = rootToObserver.get(searchRoot);
    entry.classByName = classByName;
    return;
  }

  const observer = new MutationObserver((mutations) => {
    const added = new Set();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.hasAttribute("data-component")) added.add(node);
        node
          .querySelectorAll?.("[data-component]")
          .forEach((el) => added.add(el));
      }
    }

    if (added.size === 0) return;

    const candidates = Array.from(added).filter((el) => {
      const name = el.getAttribute("data-component");
      return classByName.has(name) && !el.instance;
    });
    if (candidates.length === 0) return;

    const elementToInstance = new Map();
    for (const el of candidates) {
      const name = el.getAttribute("data-component");
      const ComponentClass = classByName.get(name);
      if (!ComponentClass) continue;
      const instance = new ComponentClass();
      instance.element = el;
      instance.node = { parent: null, children: [] };
      instance.componentId = generateComponentId();
      el.setAttribute("data-component-id", instance.componentId);
      el.instance = instance;
      elementToInstance.set(el, instance);
    }

    for (const el of candidates) {
      const instance = elementToInstance.get(el);
      if (!instance) continue;
      const parentEl = el.parentElement?.closest("[data-component]");
      if (parentEl) {
        const parentInstance =
          elementToInstance.get(parentEl) || parentEl.instance;
        if (parentInstance && parentInstance.node) {
          instance.node.parent = parentInstance.node;
          parentInstance.node.children.push(instance.node);
        }
      }
      for (const child of candidates) {
        if (child === el) continue;
        const nearest = child.parentElement?.closest("[data-component]");
        if (nearest === el) {
          const childInstance = elementToInstance.get(child);
          if (childInstance) {
            instance.node.children.push(childInstance.node);
            childInstance.node.parent = instance.node;
          }
        }
      }
    }

    for (const instance of elementToInstance.values()) {
      if (typeof instance.connect === "function") instance.connect();
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });
  rootToObserver.set(searchRoot, { observer, classByName });
};
