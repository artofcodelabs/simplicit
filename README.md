![logo](https://raw.githubusercontent.com/artofcodelabs/artofcodelabs.github.io/master/assets/ext/loco_logo_trans_sqr-300px.png)

> Simplicit provides a logical structure for JavaScript code

# 🧐 What is Simplicit?

Simplicit provides a logical structure for JavaScript code.

Model–view–controller (known as MVC) frameworks like [Ruby on Rails](https://rubyonrails.org) are popular on the back-end. The controller's action handles a specific incoming request, orchestrates data and logic, and returns a response.
I wanted to be sure that _"the same"_ controller's action that handles a request on the back-end is also called on the front-end side. By "the same" - I mean an action with the same name and defined in a controller with the corresponding name to the one on the server-side. Namespacing is optional.

# 🤝 Dependencies

🎊 Simplicit relies only on `dompurify` for sanitizing HTML. 🎉

# 📥 Installation

```bash
$ npm install --save simplicit
```

# 👷🏻‍♂️ How does it work?

After the document is loaded, Simplicit checks the following `<body>`'s data attributes:

* data-namespace
* data-controller
* data-action

Then, it initializes given controllers and calls given methods based on their values. Example:

```html
<body data-namespace="Main" data-controller="Pages" data-action="index">
</body>
```

Simplicit will act like this (a simplified version):

```javascript
import { init } from "simplicit";

// all controllers are assigned to Controllers object

namespaceController = new Controllers.Main;
Controllers.Main.initialize();               // if exists
namespaceController.initialize();            // if exists

controller = new Controllers.Main.Pages;
Controllers.Main.Pages.initialize();         // if exists
controller.initialize();                     // if exists
Controllers.Main.Pages.index();              // if exists
controller.index();                          // if exists
```

What's essential is that Simplicit looks not only for instance methods but static ones as well. If some controller is not defined, Simplicit skips it. The same situation is with methods. You don't have to create controllers for every page that you have. You can use Simplicit only on desired ones. It does not want to take over your front-end. Augment with JavaScript only these pages that you want.

If the namespace controller is not defined, Simplicit skips it and assumes `Controllers.Pages` as a controller.

# 🎮 Usage

```javascript
import { init } from 'simplicit';

import Main from './js/controllers/main';

const Controllers = { Main };

document.addEventListener("DOMContentLoaded", function() {
  init(Controllers);
});

```

The `init` function returns an object with 3 properties: `namespaceController`, `controller` and `action`. They store instances of current controllers and the action name.

# 💀 Anatomy of the controller

*Exemplary controller:*

```javascript
// js/controllers/admin/coupons.js

import { helpers } from "simplicit";

import New from "views/admin/coupons/new";
import List from "views/admin/coupons/list";

class Coupons {
  // Simplicit supports static and instance methods
  static index() {
    new List().render();
  }

  new() {
    const view = new New({ planId: helpers.params.id });
    view.render();
  }
}

export default Coupons;
```

# 🔩 Merging controllers

As you can see in the `Usage` section, Simplicit must have access to all defined controllers to initialize them and to call given methods on them. Therefore, they have to be merged with an object that holds controllers and is passed to the `init` function.

_Example:_

```javascript
// js/index.js (entry point)

import { init } from 'simplicit';

import Admin from "./controllers/admin"; // namespace controller
import User from "./controllers/user";   // namespace controller

import Articles from "./controllers/admin/Articles";
import Comments from "./controllers/admin/Comments";

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

Remember to polyfill `Object.assign` or assign controllers using a different method.

# 🛠 Helpers

Simplicit exports `helpers` object that has the following properties:

* **params** (getter) - facilitates fetching params from the URL

# Components

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
