# 🧐 What is Simplicit?

Simplicit is a small library for structuring front-end JavaScript around **controllers** and **components**.

On the MVC side, it mirrors the “controller/action” convention you may know from frameworks like [Ruby on Rails](https://rubyonrails.org): based on `<body>` attributes, it finds the corresponding controller and calls its lifecycle hooks and action method.

On the component side, it provides a lightweight runtime (`start()` + `Component`) that instantiates and binds components from `data-component`, builds parent/child relationships, and automatically tears them down when elements are removed from the DOM.

# 🤝 Dependencies

Simplicit relies only on `dompurify` for sanitizing HTML.

# 📲 Installation

```bash
$ npm install --save simplicit
```

# 🎮 Usage

## Controllers

Simplicit must have access to all controllers you want to run. In practice, you build a `Controllers` object and pass it to `init()`.

_Example:_

```javascript
// js/index.js (entry point)

import { init } from 'simplicit';

import Admin from "./controllers/Admin.js"; // namespace controller
import User from "./controllers/User.js";   // namespace controller

import Articles from "./controllers/admin/Articles.js";
import Comments from "./controllers/admin/Comments.js";

Object.assign(Admin, {
  Articles,
  Comments
});

const Controllers = {
  Admin,
  User
};

document.addEventListener("DOMContentLoaded", function() {
  init(Controllers);
});
```

### 💀 Anatomy of the controller

Example controller:

```javascript
// js/controllers/admin/Articles.js

import { helpers } from "simplicit";

import Index from "views/admin/articles/Index.js";
import Show from "views/admin/articles/Show.js";

class Articles {
  // Simplicit supports both static and instance actions
  static index() {
    Index.render();
  }

  show() {
    Show.render({ id: helpers.params.id });
  }
}

export default Articles;
```

Minimal view example (one possible approach):

```javascript
// views/admin/articles/Show.js

export default {
  render: ({ id }) => {
    const el = document.getElementById("app");
    el.textContent = `Article ${id}`;
    // If you need data loading, you can fetch here and update the DOM after.
  },
};
```

### 👷🏻‍♂️ How does it work?

On `DOMContentLoaded`, Simplicit reads these `<body>` attributes:

* `data-namespace` (optional): a namespace path like `Main` or `Main/Panel`
* `data-controller`: controller name (e.g. `Pages`)
* `data-action`: action name (e.g. `index`)

```html
<body data-namespace="Main/Panel" data-controller="Pages" data-action="index">
</body>
```

Then it resolves the matching controller(s), runs lifecycle hooks, and calls the action.

Resolution rules (simplified):

* If `data-namespace` resolves (e.g. `Main/Panel` → `Controllers.Main.Panel`), Simplicit initializes the namespace controller and resolves the page controller under it (e.g. `Controllers.Main.Panel.Pages`).
* Otherwise it skips the namespace controller and falls back to `Controllers.Pages`.

Call order (per controller):

* If a method exists as **static** or **instance**, Simplicit will call it.
* On navigation/re-init, previously active controllers receive `deinitialize()` (if present).

```javascript
namespaceController = new Controllers.Main.Panel;
Controllers.Main.Panel.initialize();               // if exists
namespaceController.initialize();                  // if exists

controller = new Controllers.Main.Panel.Pages;
Controllers.Main.Panel.Pages.initialize();         // if exists
controller.initialize();                           // if exists
Controllers.Main.Panel.Pages.index();              // if exists
controller.index();                                // if exists
```

You don’t need controllers for every page; if a controller/method is missing, Simplicit skips it.

The `init` function returns `{ namespaceController, controller, action }`.

## Components

Simplicit also ships with a small component runtime built around DOM attributes.

### ✅ Quick start

```javascript
import { start, Component } from "simplicit";

class App extends Component {
  static name = "app";
}

class Hello extends Component {
  static name = "hello";

  connect() {
    const { input, button, output } = this.refs();
    this.on(button, "click", () => {
      output.textContent = `Hello ${input.value}!`;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  start({ root: document, components: [App, Hello] });
});
```

```html
<body data-component="app">
  <div data-component="hello">
    <input data-ref="input" type="text" />
    <button data-ref="button">Greet</button>
    <span data-ref="output"></span>
  </div>
</body>
```

### DOM conventions

* **`data-component="<name>"`**: marks an element as a component root.
  * `<name>` must match the component class’ **`static name`**.
  * `<script>` tags are never treated as components, even if they have `data-component`.
* **`data-component-id="<id>"`**: set automatically on every component root element.
  * Also available as `instance.componentId`.
* **`data-ref="<key>"`**: marks ref elements inside a component (see `ref()` / `refs()`).

### `start({ root, components })`

`start()` mounts components under `root` (defaults to `document.body`) and keeps them in sync with DOM changes.

* **Validation**
  * Throws if there are **no** `data-component` elements within `root`.
  * Throws if the DOM contains `data-component="X"` but you didn’t pass a matching class in `components`.
  * Throws if a provided component class does not define a writable `static name`.
* **Lifecycle**
  * When an instance is created, if it has `connect()`, it is called after `this.element` is set.
  * When a component element is removed from the DOM, its `instance.disconnect()` is called automatically.

#### Return value

`start()` returns an object:

* **`roots`**: array of root component instances (components whose parent is `null`) discovered at startup.
* **`components`**: the registered component classes.
* **`addComponents(newComponents)`**: registers additional component classes later.
  * Validates the DOM again.
  * Initializes matching elements that already exist.
  * Returns the newly created instances (or `null` if nothing was added).

### Base class: `Component`

Simplicit exports a `Component` base class you can extend.

#### Core properties

* **`element`**: the root DOM element of the component (`data-component="..."`).
* **`node`**: internal node graph `{ name, element, parent, children, siblings }`.
* **`componentId`**: string id mirrored to `data-component-id`.
* **`parent`**: parent component instance (or `undefined` for root components).

#### Relationships

All relationship helpers filter by component name(s):

* **`children(nameOrNames)`**: direct children component instances (DOM order).
* **`siblings(nameOrNames)`**: sibling component instances.
* **`ancestor(name)`**: nearest matching ancestor component instance (or `null`).
* **`descendants(name)`**: all matching descendants (flat array).

#### Refs

Refs are scoped to the component’s root element.

* **`ref(name)`**: returns `null`, a single element, or an array of elements (when multiple match).
* **`refs()`**: returns an object mapping each `data-ref` key to `Element | Element[]` (missing keys are absent).

#### Cleanup & lifecycle utilities

`disconnect()` runs cleanup callbacks once and detaches the instance from its parent/child links.

You can register cleanup manually or use helpers that auto-register cleanup:

* **`registerCleanup(fn)`**
* **`on(target, type, listener, options)`** (auto-removes the listener on disconnect)
* **`timeout(fn, delay)`** (auto-clears on disconnect)
* **`interval(fn, delay)`** (auto-clears on disconnect)

### Server-driven templates via `<script type="application/json">`

If a component class defines `static template(data)`, Simplicit can render HTML from JSON embedded in the page.

```javascript
import { start, Component } from "simplicit";

class Slide extends Component {
  static name = "slide";
  static template = ({ text }) => `<div data-component="slide">${text}</div>`;
}

start({ root: document, components: [Slide] });
```

```html
<div id="slideshow"></div>

<script
  type="application/json"
  data-component="slide"
  data-target="slideshow"
  data-position="beforeend"
>
  [{"text":"A"},{"text":"B"}]
</script>
```

Notes:

* The JSON payload must be an **array**; each item is passed to `ComponentClass.template(item)`.
* The rendered HTML is sanitized with `dompurify` before being inserted.
* `data-target` must match an existing element id, otherwise an error is thrown.
* Inserted component elements are then auto-initialized like any other DOM addition.

```html
<body data-component="app" data-component-id="1"> <!-- instance -->
  <div data-component="hello" data-component-id="2"> <!-- instance -->
    <input data-ref="input" type="text">
    <button data-ref="button">Greet</button>
    <span data-ref="output"></span>
  </div>

  <div data-component="clock" data-component-id="3"> <!-- instance -->
    <p data-ref="time"></p>
  </div>
</body>
```

```javascript
// component instance
{
  node
  componentId: "1",
}

// node
{
  name: "app",
  element,
  parent: null,
  children: [],
  siblings: [],
}
```

# 🛠 Helpers

Simplicit exports `helpers` object that has the following properties:

* **params** (getter) - facilitates fetching params from the URL

# 👩🏽‍🔬 Tests

```bash
npx playwright install

npm run test

npx playwright test --headed e2e/slideshow.spec.js
```

# 📜 License

Simplicit is released under the [MIT License](https://opensource.org/licenses/MIT).

# 👨‍🏭 Author

Zbigniew Humeniuk from [Art of Code](https://artofcode.co)
