import { dataComponentAttribute } from "./config";
export const createNode = (element) => {
  return {
    name: element.getAttribute(dataComponentAttribute),
    element,
    parent: null,
    children: [],
    siblings: [],
  };
};
