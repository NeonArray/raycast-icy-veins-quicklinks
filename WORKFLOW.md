# Development Workflow

Follow this sequence for every feature or fix, no matter how small.

## 1. Plan
- Understand the request fully before touching any code
- Identify which files will change
- If the change is non-trivial, ask clarifying questions first

## 2. Execute
- Make the code changes
- Keep changes focused and surgical — don't touch unrelated code

## 3. QA
- Run `npm run build` — must pass with zero errors
- Run `npm test` — all tests must pass
- Run `npm run lint` (or `npm run fix-lint` to auto-fix)
- If behaviour changed, manually verify it makes sense

## 4. Document
- Update `README.md` if the feature is user-facing or affects the dev workflow
- Update project structure section if new files were added

## 5. Changelog
- Add an entry to `CHANGELOG.md` at the top of the file
- Format:
  ```
  ## [Short Feature Title] - YYYY-MM-DD

  ### Added / Changed / Fixed
  - Bullet describing what changed from the user's perspective
  ```
- Focus on what the user sees, not implementation details

## 6. Commit + Tag
- Stage all changed files including `CHANGELOG.md` and `README.md`
- Commit with a descriptive message following conventional commits:
  - `feat:` new feature
  - `fix:` bug fix
  - `chore:` non-functional change (deps, config, docs)
- Tag the commit following semver:
  - `vX.Y.Z` — patch for fixes, minor for features, major for breaking changes
  - `git tag vX.Y.Z`
- **Do not push** unless the user asks
