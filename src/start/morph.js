const PRESERVED_ATTRIBUTES = new Set(["data-component-id", "data-props"]);

const isElement = (node) => node.nodeType === Node.ELEMENT_NODE;

const elements = (nodes) => nodes.filter(isElement);

const key = (node) => (isElement(node) ? node.getAttribute("data-key") : null);

const sameNode = (a, b) => {
  if (a.nodeType !== b.nodeType) return false;
  if (isElement(a)) {
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

const warnMissingKeys = (from, fromChildren, toChildren) => {
  const fromEls = elements(fromChildren);
  const toEls = elements(toChildren);

  if (fromEls.length === toEls.length) return;

  const byTag = new Map();
  const tally = (els, side) => {
    for (const el of els) {
      const entry = byTag.get(el.tagName) || { from: [], to: [] };
      entry[side].push(el);
      byTag.set(el.tagName, entry);
    }
  };
  tally(fromEls, "from");
  tally(toEls, "to");

  for (const [tag, { from: f, to: t }] of byTag) {
    if (f.length < 2 && t.length < 2) continue;
    if ([...f, ...t].some((el) => el.hasAttribute("data-key"))) continue;
    console.warn(
      `[simplicit] morph: <${tag.toLowerCase()}> siblings changed count ` +
        `without data-key. Add a stable data-key to each list item so ` +
        `identity follows data, not position. ` +
        `See README "Keying list items with data-key".`,
      from,
    );
  }
};

const morphChildren = (from, to) => {
  const fromChildren = Array.from(from.childNodes);
  const toChildren = Array.from(to.childNodes);

  warnMissingKeys(from, fromChildren, toChildren);

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
  if (isElement(from)) {
    morphAttributes(from, to);
    morphChildren(from, to);
  } else if (from.nodeValue !== to.nodeValue) {
    from.nodeValue = to.nodeValue;
  }
};

export const morph = (from, to) => morphNode(from, to);
