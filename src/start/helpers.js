import { dataPropsAttribute } from "./config.js";

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

export const root = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};

export const setProps = (html, props) => {
  const element = root(html);
  element.setAttribute(dataPropsAttribute, JSON.stringify(props));
  return element.outerHTML;
};

export const popProps = (element) => {
  const raw = element.getAttribute(dataPropsAttribute);
  if (raw === null) return {};
  element.removeAttribute(dataPropsAttribute);
  return JSON.parse(raw);
};
