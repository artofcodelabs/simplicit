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
