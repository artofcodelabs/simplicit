const processedAttr = "data-script-processed";

const isJsonTemplateScript = (node) =>
  node instanceof HTMLScriptElement &&
  node.type === "application/json" &&
  node.hasAttribute("data-component");

const collectScripts = (node) => {
  const scripts = [];
  if (isJsonTemplateScript(node)) scripts.push(node);
  if (node?.querySelectorAll) {
    node
      .querySelectorAll("script[type='application/json'][data-component]")
      .forEach((s) => scripts.push(s));
  }
  return scripts;
};

const processScript = (script, componentClasses) => {
  if (script.hasAttribute(processedAttr)) return;

  const componentName = script.dataset.component;
  const componentClass = componentClasses.find((c) => c.name === componentName);
  if (!componentClass) return;

  const targetId = script.dataset.target;
  const targetEl = document.getElementById(targetId);
  if (!targetEl) {
    throw new Error(`Script data-target="${targetId}" element not found`);
  }

  const position = script.dataset.position ?? "beforeend";
  const arr = JSON.parse(script.textContent);
  let html = "";
  arr.forEach((templateData) => {
    html += componentClass.template(templateData);
  });
  targetEl.insertAdjacentHTML(position, html);
  script.setAttribute(processedAttr, "true");
};

const processScripts = (node, componentClasses) => {
  collectScripts(node).forEach((script) =>
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
