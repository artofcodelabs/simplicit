const PRESERVED_ATTRIBUTES = new Set(["data-component-id", "data-props"]);

const key = (node) =>
  node.nodeType === Node.ELEMENT_NODE ? node.getAttribute("data-key") : null;

const sameNode = (a, b) => {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType === Node.ELEMENT_NODE) {
    return a.tagName === b.tagName && key(a) === key(b);
  }
  return true;
};

const morphAttributes = (from, to) => {
  for (const { name, value } of Array.from(to.attributes)) {
    if (from.getAttribute(name) !== value) from.setAttribute(name, value);
  }
  for (const { name } of Array.from(from.attributes)) {
    if (PRESERVED_ATTRIBUTES.has(name)) continue;
    if (!to.hasAttribute(name)) from.removeAttribute(name);
  }
};

const morphChildren = (from, to) => {
  const fromChildren = Array.from(from.childNodes);
  const toChildren = Array.from(to.childNodes);

  toChildren.forEach((toChild, i) => {
    const fromChild = fromChildren[i];
    if (!fromChild) {
      from.appendChild(toChild);
    } else if (sameNode(fromChild, toChild)) {
      morphNode(fromChild, toChild);
    } else {
      from.replaceChild(toChild, fromChild);
    }
  });

  for (let i = fromChildren.length - 1; i >= toChildren.length; i--) {
    from.removeChild(fromChildren[i]);
  }
};

const morphNode = (from, to) => {
  if (from.nodeType === Node.ELEMENT_NODE) {
    morphAttributes(from, to);
    morphChildren(from, to);
  } else if (from.nodeValue !== to.nodeValue) {
    from.nodeValue = to.nodeValue;
  }
};

export const morph = (from, to) => morphNode(from, to);
