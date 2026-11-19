import { COMPONENT, POSITION, TARGET } from "../attributes.js";
import { setProps, selfAndDescendants } from "./helpers.js";
import { sanitizedFragment } from "./sanitize.js";

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
  // Nodes, not a string: insertAdjacentHTML would re-parse in the target's
  // context and re-run the sanitizer's context problem.
  const fragment = sanitizedFragment(html);
  const insert = {
    beforebegin: () => targetEl.before(fragment),
    afterbegin: () => targetEl.prepend(fragment),
    beforeend: () => targetEl.append(fragment),
    afterend: () => targetEl.after(fragment),
  }[position];
  if (!insert) throw new Error(`Invalid ${POSITION}="${position}"`);
  insert();
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
