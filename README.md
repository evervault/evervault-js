# evervault-js
Evervault JavaScript SDK.

## Release managment

We use changsets to version manage the packages in this repo.

When creating a pr that needs to be rolled into a version release, do `npx changeset`, select the level of the version bump required and describe the changes for the change logs. DO NOT select `major` for releasing breaking changes without team approval.

To release:
- Merge the version PR that the changeset bot created to bump the version numbers.
- On local machine, `git checkout master`
- `git pull`
- `npx changeset tag`, which will create git tags for each version needed
- Push the tags needed with `git push origin <TAG_NAME>`
- Create a GitHub release with either the UI or the local CLI: `gh release create`

The production deployment action will deploy code to the production environment on release publish.

## Environments

| | Production | Staging |
|-|------------|---------|
|browser|js.evervault.com/v2/index.js|js.evervault.io/v2/index.js|
