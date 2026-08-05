import DOMPurify from "dompurify";
import { COMPONENT, POSITION, TARGET } from "../attributes.js";
import { setProps, selfAndDescendants } from "./helpers.js";

const SCRIPT_SELECTOR = `script[type='application/json'][${COMPONENT}]`;

const processScript = (script, componentClasses) => {
  const componentName = script.getAttribute(COMPONENT);
  const componentClass = componentClasses.find((c) => c.name === componentName);
  if (!componentClass) return;

  const targetId = script.getAttribute(TARGET);
  const inPlace = targetId == null;
  const targetEl = inPlace ? script : document.getElementById(targetId);
  if (!targetEl) {
    throw new Error(`Script data-target="${targetId}" element not found`);
  }

  const position =
    script.getAttribute(POSITION) ?? (inPlace ? "beforebegin" : "beforeend");
  const arr = JSON.parse(script.textContent);
  let html = "";
  arr.forEach((props) => {
    html += setProps(componentClass.template(props), props);
  });
  targetEl.insertAdjacentHTML(position, DOMPurify.sanitize(html));
  script.remove();
};

const processScripts = (node, componentClasses) => {
  selfAndDescendants(node, SCRIPT_SELECTOR).forEach((script) =>
    processScript(script, componentClasses),
  );
};

export const observeScripts = (searchRoot, componentClasses) => {
  processScripts(searchRoot, componentClasses);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        processScripts(node, componentClasses);
      }
    }
  });

  observer.observe(searchRoot, { childList: true, subtree: true });

  return {
    addComponents(newComponentClasses = []) {
      componentClasses.push(...newComponentClasses);
      processScripts(searchRoot, componentClasses);
    },
    disconnect() {
      observer.disconnect();
    },
  };
};
