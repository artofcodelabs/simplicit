---
description: How to publish the simplicit package to npm
---

# Publish to NPM

1.  **Login to NPM** (if not already logged in):
    ```bash
    npm login
    ```

2.  **Build the project**:
    Ensure the latest code is built.
    ```bash
    // turbo
    npm run build
    ```

3.  **Run Tests**:
    Ensure all tests pass before publishing.
    ```bash
    // turbo
    npm run test
    ```

4.  **Version the package**:
    Update the version in `package.json`. You can use `npm version` for this.
    *   For a patch (0.0.x): `npm version patch`
    *   For a minor update (0.x.0): `npm version minor`
    *   For a major update (x.0.0): `npm version major`

    ```bash
    # Example:
    npm version patch
    ```

5.  **Publish**:
    Publish the package to the npm registry.
    ```bash
    npm publish --access public
    ```
