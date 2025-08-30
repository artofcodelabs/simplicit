const components = [];

const start = () => {
  console.log(">>> start");

  // Reset previously collected components while preserving the array reference
  components.length = 0;

  // Find all component elements
  const componentElements = Array.from(
    document.querySelectorAll("[data-component]"),
  );

  // Create a node for each element upfront so parent/child linking doesn't depend on order
  const elementToNode = new Map();
  for (const element of componentElements) {
    const name = element.getAttribute("data-component");
    elementToNode.set(element, {
      name,
      element,
      children: [],
    });
  }

  // Link nodes into a tree based on the nearest ancestor component
  for (const element of componentElements) {
    const node = elementToNode.get(element);
    const parentElement = element.parentElement?.closest("[data-component]");
    if (parentElement && elementToNode.has(parentElement)) {
      const parentNode = elementToNode.get(parentElement);
      parentNode.children.push(node);
    } else {
      components.push(node);
    }
  }

  console.log(components);
};

export default start;
