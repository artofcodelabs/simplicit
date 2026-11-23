---
description: How to publish the simplicit package to npm
---

# Publish to NPM

1.  **Version the package on the release branch** (before merging to `master`):
    Bump `package.json` and `package-lock.json` without a commit or tag,
    and commit the bump with the rest of the branch.
    While on `0.x`, a breaking change bumps the minor version (`0.5.2` → `0.6.0`),
    because `^0.5.2` only accepts `0.5.x`.
    ```bash
    npm version 0.6.0 --no-git-tag-version
    ```

2.  **Login to NPM** (if not already logged in):
    ```bash
    npm login
    ```

3.  **Run Tests** on `master` after the merge:
    Ensure all tests pass before publishing.
    ```bash
    // turbo
    npm run test
    ```

4.  **Tag the release**:
    ```bash
    git tag v$(node -p "require('./package.json').version")
    git push origin --tags
    ```

5.  **Publish**:
    `npm publish` runs the `prepare` script, which rebuilds `dist`.
    ```bash
    npm publish --access public
    ```
