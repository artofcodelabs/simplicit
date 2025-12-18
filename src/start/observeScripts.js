export const observeScripts = (searchRoot, componentClasses) => {
  const scripts = searchRoot.querySelectorAll(
    "script[type='application/json']",
  );
  for (const script of scripts) {
    const componentClass = componentClasses.find(
      (c) => c.name === script.dataset.component,
    );
    if (!componentClass) {
      throw new Error(
        `Script data-component="${script.dataset.component}" not found in componentClasses`,
      );
    }
    const arr = JSON.parse(script.textContent);
    let html = "";
    arr.forEach((templateData) => {
      html += componentClass.template(templateData);
    });
    document
      .getElementById(script.dataset.target)
      .insertAdjacentHTML(script.dataset.position, html);
  }
};
