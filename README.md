# evervault-js
Evervault JavaScript SDK.

## Setup

First get a node version manager to install node. Any version manager that supports `.nvmrc` will work.

- [fnm (Recommended)](https://github.com/Schniz/fnm)
- [nvm](https://github.com/nvm-sh/nvm)

Install node with your version manager and ensure `node -v` maches the version in `.nvmrc`.

Set up `pnpm` with:

```bash
# Corepack is recommended for local setup but is still in beta
corepack enable

corepack prepare pnpm@latest-8 --activate
```

or

```bash
# Install pnpm globally with npm old-school
npm install -g pnpm
```

Install the Turborepo CLI set up globally, so we can link the workspace to Vercel for remote caching.

```bash
pnpm install turbo --global
```

Install the dependencies with:

```bash
pnpm install
```

## Remote caching

We use Vercel for remote caching of the packages in this repo. This means that when you install a package from this repo, it will be cached on Vercel and subsequent installs will be much faster.

Run `turbo link` to link the workspace to Vercel with your account. 


## Building

`pnpm build` will build all packages in the repo.

The build artifacts will be under `dist` in each package.

## Testing

`pnpm test` will run all unite tests in the repo.

`pnpm e2e:test` will run all Playwright e2e tests in the repo.

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
