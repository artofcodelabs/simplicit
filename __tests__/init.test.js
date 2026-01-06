import { init } from "index";

let counter;

const Wrapper = {
  initialize: () => {
    counter += 1;
  },

  deinitialize: () => {
    counter -= 1;
  },
};

class Main {
  initialize() {
    counter += 2;
  }

  deinitialize() {
    counter -= 2;
  }

  list() {
    counter += 3;
  }
}

const Controllers = {
  Wrapper: { ...Wrapper, Main },
};

beforeEach(() => {
  counter = 0;
});

it("calls out a correct controller action based on body attributes", () => {
  document.body.setAttribute("data-namespace", "Wrapper");
  document.body.setAttribute("data-controller", "Main");
  document.body.setAttribute("data-action", "list");

  expect(counter).toEqual(0);
  init(Controllers);
  expect(counter).toEqual(6);
  init(Controllers);
  expect(counter).toEqual(9);
});

it("allows accessing namespace controller and controller from each other", () => {
  const { namespaceController, controller } = init(Controllers);

  expect(namespaceController.controller).toBe(controller);
  expect(controller.namespaceController).toBe(namespaceController);
});

it("supports nested namespaces (e.g. Main/Panel)", () => {
  let nestedCounter = 0;

  const Panel = {
    initialize: () => {
      nestedCounter += 10;
    },
    deinitialize: () => {
      nestedCounter -= 10;
    },
  };

  class Pages {
    initialize() {
      nestedCounter += 2;
    }
    deinitialize() {
      nestedCounter -= 2;
    }
    index() {
      nestedCounter += 3;
    }
  }

  const NestedControllers = {
    Main: {
      Panel: Object.assign(Panel, { Pages }),
    },
  };

  document.body.setAttribute("data-namespace", "Main/Panel");
  document.body.setAttribute("data-controller", "Pages");
  document.body.setAttribute("data-action", "index");

  expect(nestedCounter).toEqual(0);
  init(NestedControllers);
  expect(nestedCounter).toEqual(15);

  init(NestedControllers);
  expect(nestedCounter).toEqual(18);
});

it("falls back to top-level controller when namespace path is missing", () => {
  let local = 0;

  class Pages {
    initialize() {
      local += 1;
    }
    list() {
      local += 2;
    }
  }

  const Controllers = {
    Pages,
  };

  document.body.setAttribute("data-namespace", "");
  document.body.setAttribute("data-controller", "Pages");
  document.body.setAttribute("data-action", "list");

  init(Controllers);
  expect(local).toEqual(3);
});

it("falls back to top-level controller when data-namespace is missing", () => {
  let local = 0;

  class Pages {
    initialize() {
      local += 1;
    }
    list() {
      local += 2;
    }
  }

  const Controllers = {
    Pages,
  };

  document.body.setAttribute("data-controller", "Pages");
  document.body.setAttribute("data-action", "list");

  init(Controllers);
  expect(local).toEqual(3);
});
