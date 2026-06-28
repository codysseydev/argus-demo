# Releasing Argus UI

Argus UI is **not published to npm**. A release is a tagged commit on `main` with
an accompanying GitHub Release, optionally shipping a prebuilt `dist/` archive for
consumers who want a ready-to-serve bundle.

Refer to the org-wide playbook at
[codysseydev/.github](https://github.com/codysseydev/.github) for policies that
apply across all Codyssey repos (branch protection, sign-off requirements,
versioning philosophy).

## Release checklist

1. **Update `CHANGELOG.md`**

   Move all entries under `## [Unreleased]` into a new versioned section:

   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD
   ```

   Add the comparison link at the bottom of the file:

   ```markdown
   [X.Y.Z]: https://github.com/codysseydev/argus-ui/compare/vA.B.C...vX.Y.Z
   ```

2. **Bump the version in `package.json`**

   Update `"version"` to `"X.Y.Z"`. Keep `"private": true`.

3. **Commit**

   ```bash
   git add CHANGELOG.md package.json
   git commit -m "chore: release vX.Y.Z"
   ```

4. **Tag**

   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```

5. **Build (optional)**

   If you want to attach a prebuilt bundle to the GitHub Release:

   ```bash
   npm ci
   npm run build
   # dist/ is now ready; zip it up or attach files directly
   ```

6. **Create the GitHub Release**

   Go to https://github.com/codysseydev/argus-ui/releases/new, select tag
   `vX.Y.Z`, paste the relevant CHANGELOG section as the release notes, and
   optionally upload the `dist/` archive.

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (`0.1.x`): bug fixes, dependency bumps, documentation corrections.
- **Minor** (`0.x.0`): new screens, new hooks, backward-compatible API changes.
- **Major** (`x.0.0`): breaking changes (renamed env vars, removed screens,
  API contract changes that require a matching Argus API bump).
