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

export const attachProps = (html, props) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  root.setAttribute(dataPropsAttribute, JSON.stringify(props));
  return template.innerHTML;
};

export const readProps = (element) => {
  const raw = element.getAttribute(dataPropsAttribute);
  if (raw === null) return {};
  element.removeAttribute(dataPropsAttribute);
  return JSON.parse(raw);
};
