import { dataComponentAttribute } from "./config.js";
export const createNode = (element) => {
  return {
    name: element.getAttribute(dataComponentAttribute),
    element,
    parent: null,
    children: [],
    siblings: [],
  };
};
