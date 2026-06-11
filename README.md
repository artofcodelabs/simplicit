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

## 🖲️ Components

Simplicit ships with a small component runtime built around DOM attributes.

### ✅ Quick start

```javascript
import { start, Component } from "simplicit";

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
  start({ root: document, components: [Hello] });
});
```

```html
<div data-component="hello">
  <input data-ref="input" type="text" />
  <button data-ref="button">Greet</button>
  <span data-ref="output"></span>
</div>
```

### DOM conventions

* **`data-component="<name>"`**: marks an element as a component root.
  * `<name>` must match the component class’ **`static name`**.
  * `<script>` tags are never treated as components, even if they have `data-component`.
* **`data-component-id="<id>"`**: set automatically on every element with `data-component` (each component instance).
  * Also available as `instance.componentId`.
* **`data-ref="<key>"`**: marks ref elements inside a component (see `ref()` / `refs()`).

### `start({ root, components })`

`start()` scans `root` (defaults to `document.body`) for elements with `data-component`, creates and binds component instances for them, and keeps them in sync with DOM changes (new elements get initialized, removed ones get disconnected).

* **Validation**
  * Throws if the DOM contains `data-component="X"` but you didn’t pass a matching class in `components`.
  * Throws if any provided component class does not define a writable `static name`.
* **Lifecycle**
  * When an instance is created, if it has `connect()`, it is called after the instance is bound to its root DOM element (available as `this.element`).
  * When a component element is removed from the DOM, its `instance.disconnect()` is called automatically.

#### Return value

`start()` returns an object:

* **`roots`**: array of root component instances (components whose parent is `null`) discovered at startup.
* **`addComponents(newComponents)`**: registers additional component classes later.
  * Validates the DOM again.
  * Scans the existing DOM for elements with `data-component` matching the newly added classes and initializes those that weren’t initialized yet.
  * Returns the newly created instances (or `null` if nothing was added).

### Base class: `Component`

Simplicit exports a `Component` base class you can extend.

#### Core properties

* **`element`**: the root DOM element of the component (`data-component="..."`).
* **`node`**: internal node graph `{ name, element, parent, children, siblings }`.
* **`componentId`**: string id mirrored to `data-component-id`.
* **`parent`**: parent component instance (or `null` for root components).
* **`props`**: the data the component was rendered with (see [templates](#server-driven-templates-via-script-typeapplicationjson) / `Component.render`), available before `connect()`. Defaults to `{}` for components mounted from plain markup. Treat `props` as the full state that drives the markup.

#### Reactive updates

* **`update(partial)`**: merges `partial` into `this.props`, re-renders `static template(this.props)`, and **morphs** the result into the live DOM — patching only changed text/attributes/nodes instead of replacing the subtree. Returns `this`.

  Because morphing keeps node identity, anything tied to an unchanged node survives the update: focus, text selection, and scroll position.

  This makes the template a pure function of `props`: write a single decision tree over all props that affect the markup, then call `update()` to move between states instead of mutating the DOM by hand.

#### Keying list items with `data-key`

Morphing compares the old and new children **by position**: child 1 against child 1, child 2 against child 2, and so on. Same tag at a position → the existing node is patched in place; different tag → it’s replaced. That’s exactly right for fixed layouts, but it’s the wrong default for a **list whose items reorder, get inserted, or get removed**.

Say you render a list and then delete the first item. Positionally, every item shifts up one slot, so the morph patches each surviving node into the *next* item’s data — every row is mutated, and whatever was tied to those nodes (focus, a half-typed input, a CSS transition) is now attached to the wrong row.

Add **`data-key="<stable-id>"`** to each item so morphing can recognise identity instead of trusting position:

```javascript
static template = ({ todos }) => `
  <ul data-component="todos">
    ${todos.map((t) => `<li data-key="${t.id}">${t.label}</li>`).join("")}
  </ul>
`;
```

With keys, two nodes are only treated as “the same” when their tag **and** `data-key` match; a position whose key changed is replaced rather than mutated, so a node’s identity follows its data, not its slot. Recommended whenever you render a collection from an array — use a stable id from your data (a database id, a uuid), never the array index, since the index is just the position you’re trying to stop relying on.

> Note: keys here are a correctness guard for the positional diff (replace-vs-patch), not full move-detection — the morph doesn’t relocate a moved node, it rebuilds it where the key no longer matches. That keeps identity attached to the right data; it just doesn’t physically reuse a node that jumped position.

#### Listeners

Bind events to your component's elements **by ref name**, declared once in `connect()`:

```javascript
class Counter extends Component {
  static name = "counter";

  static template = ({ count }) =>
    `<div data-component="counter"><button data-ref="inc">${count}</button></div>`;

  connect() {
    this.on("inc", "click", () => this.update({ count: this.props.count + 1 }));
    this.update({ count: 0 }); // paint the initial template into the empty <div data-component="counter">
  }
}
```

A component mounted from plain markup keeps whatever HTML is already inside its element — `template` does **not** run automatically. To render it client-side, call `update(initialProps)` in `connect()` (as above); it morphs the template in, and `on("<ref>", ...)` then attaches to the freshly painted refs.

**`on(target, type, listener, options?)`** — `target` can be a **ref name** (`"inc"`) or a **ref element** (`this.ref("inc")`); both behave identically, because an element carries its own `data-ref`. The framework keeps `listener` attached to whatever `[data-ref]` elements match after **every** render: it binds nodes that morphing recreated, binds refs that only appear in a later state, unbinds ones that disappear, and de-duplicates so kept nodes never stack handlers. Declare it once in `connect()` and never think about it again.

The one difference is for targets that **have no `data-ref`** — `window`, `document`, or the component root (`this.element`). Those can't be addressed by ref, so the listener is simply pinned to that exact object (and, since those never get morphed away, that's all you need).

Prefer the ref name for not-yet-rendered elements: `this.ref("inc")` returns `null` before its first render, so only `on("inc", ...)` can bind a ref that appears later.

Both return an `off()` and are cleared automatically on `disconnect()`. For an imperative touch-up after a state change (focus an input, scroll into view), do it right after `update()` — the morph is synchronous, so the new ref is already in the DOM:

```javascript
edit() {
  this.update({ editing: true });
  this.ref("input").focus(); // input exists now
}
```

#### Relationships

All relationship helpers filter by component name(s):

* **`children(nameOrNames)`**: direct children component instances (DOM order).
* **`siblings(nameOrNames)`**: sibling component instances.
* **`ancestor(name)`**: nearest matching ancestor component instance (or `null`).
* **`descendants(name)`**: all matching descendants (flat array).

#### Refs

Refs are scoped to the component’s root element.

* **`ref(name)`**: returns `null`, a single element, or an array of elements (when multiple match).
* **`refs()`**: returns an object mapping each `data-ref` key to `Element | Element[]`. Only elements inside the component that have `data-ref` are included.

#### Cleanup & lifecycle utilities

`disconnect()` runs cleanup callbacks once and detaches the instance from its parent/child links.

You can register cleanup manually or use helpers that auto-register cleanup:

* **`registerCleanup(fn)`**
* **`on(target, type, listener, options)`** (auto-removes the listener on disconnect)
* **`timeout(fn, delay)`** (auto-clears on disconnect)
* **`interval(fn, delay)`** (auto-clears on disconnect)

### Server-driven templates via `<script type="application/json">`

If a component class defines `static template(props)`, Simplicit can render HTML from JSON embedded in the page.

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

Or drop `data-target`/`data-position` to render in place, where the script sits:

```html
<div id="slideshow">
  <script type="application/json" data-component="slide">
    [{"text":"A"},{"text":"B"}]
  </script>
</div>
```

Notes:

* The JSON payload must be an **array**; each item is passed as `props` to `ComponentClass.template(props)`.
* Each item is also attached to its rendered root element and exposed on the instance as **`this.props`** (available in `connect()`)
* To render the same way from your own code (e.g. when inserting a component dynamically), use **`Component.render(props)`** — it calls `static template(props)` and attaches `props`, so instances created this way also get `this.props`:

  ```javascript
  this.element.insertAdjacentHTML("beforeend", Slide.render({ text: "A" }));
  ```

* The rendered HTML is sanitized with `dompurify` before being inserted.
* The `<script>` is removed from the DOM once rendered.
* `data-target`, if present, must match an existing element id, otherwise an error is thrown. If **omitted**, the script element itself is the anchor — rendered HTML is inserted at the script's own position (default `beforebegin`, i.e. right where the script sits).
* Insertion uses `targetEl.insertAdjacentHTML(position, html)` where `position` comes from `data-position`. Default: `beforeend` when `data-target` is set, `beforebegin` when it is omitted. Valid values: `beforebegin`, `afterbegin`, `beforeend`, `afterend`.
* Inserted component elements are then auto-initialized like any other DOM addition.

## 🕹️ Controllers

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

### Ruby on Rails: generating `<body>` data attributes

If you want Rails to generate the controller metadata for Simplicit automatically, you can derive it from `controller_path`, `controller_name`, and `action_name`.

This version supports nested namespaces like `Main/Panel` (any depth):

```ruby
# app/helpers/application_helper.rb

module ApplicationHelper
  def simplicit_body_attrs(default_namespace: nil)
    namespace = controller_path
      .split("/")
      .then { |parts| parts[0...-1] } # everything except the controller name
      .map(&:camelize)
      .join("/")

    # If you want a default namespace (e.g. "Main") for non-namespaced controllers:
    namespace = default_namespace if namespace.blank? && default_namespace

    {
      data: {
        namespace: namespace.presence,           # -> data-namespace="Main/Panel"
        controller: controller_name.camelize,    # -> data-controller="Articles"
        action: action_name,                     # -> data-action="index"
      }.compact,
    }
  end
end
```

```erb
<%= content_tag :body, simplicit_body_attrs(default_namespace: "Main") do %>
  <%= yield %>
<% end %>
```

## 🛠 Helpers

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
