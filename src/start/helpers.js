import { PROPS } from "../attributes.js";

let componentIdCounter = 1;
export const generateComponentId = () => `${componentIdCounter++}`;

export const destructArray = (array) => {
  switch (array.length) {
    case 0:
      return null;
    case 1:
      return array[0];
    default:
      return array;
  }
};

// The node itself (when it matches) plus every matching descendant.
export const selfAndDescendants = (node, selector) => {
  const found = node.matches?.(selector) ? [node] : [];
  node.querySelectorAll?.(selector)?.forEach((el) => found.push(el));
  return found;
};

export const root = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};

export const setProps = (html, props) => {
  const element = root(html);
  element.setAttribute(PROPS, JSON.stringify(props));
  return element.outerHTML;
};

export const popProps = (element) => {
  const raw = element.getAttribute(PROPS);
  if (raw === null) return {};
  element.removeAttribute(PROPS);
  return JSON.parse(raw);
};
