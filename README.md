# evervault-js

Evervault JavaScript SDK.

## Repository structure

This is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces).

### Public Packages

- `packages/browser` - [Evervault JavaScript SDK for the browser.](https://docs.evervault.com/sdks/javascript).
- `packages/react` - [The React SDK](https://docs.evervault.com/sdks/reactjs)
- `packages/react-native-v2` - [React Native SDK](https://docs.evervault.com/sdks/react-native)
- `packages/card-validator` - card number validator shared between react and react-native

### Private Packages

- `packages/3ds` - Code base for 3ds page for mobile SDKs
- `packages/inputs` - The codebase for Inputs
- `packages/ui-components` - The codebase for UI Components.
- `packages/themes` - An internal package for UI Component themes
- `packages/types` - An internal package for types that are shared between multiple packages
- `packages/eslint-config-custom` - A project wide custom eslint config
- `packages/tsconfig` - A project wide tsconfig
- `e2e-tests` - End to end tests for the packages.
- `examples` - A folder of different examples using the JS and React SDK.
- `statics` - Contains a few static JSON files served from the browser endpoint that barely change.

## Setup

First get a node version manager to install node. Any version manager that supports `.nvmrc` will work.

- [fnm (Recommended)](https://github.com/Schniz/fnm)
- [nvm](https://github.com/nvm-sh/nvm)

Install node with your version manager and ensure `node -v` maches the version in `.nvmrc`.

Set up [pnpm](https://pnpm.io/) with:

```bash
# Corepack is recommended for local setup but is still in beta
corepack enable

corepack prepare pnpm@latest-9 --activate
```

or

```bash
# Install pnpm globally with npm old-school
npm install -g pnpm
```

Install the dependencies with:

```bash
pnpm install
```

Create a .env file in the project root. You can use the [`.env.example`](.env.example) file as a template for the variables you will need to set.

## Development

The best way to work on the SDK's is by using one of the example projects. If you run `pnpm dev` in the project root you will be prompted to choose which example project you want to work with. After selecting one, it and all of its dependendies will be run in development mode and any changes you make will be updated immediately.

The example project will be available on [localhost:4000](https://localhost:4000) after it has started up.

## Building

`pnpm build` will build all packages in the repo.

The build artifacts will be under `dist` in each package.

## Testing

`pnpm test` will run all unit tests in the repo.

`pnpm e2e:test` will run all Playwright e2e tests in the repo.

Both `test` and `e2e:test` will need to pass in CI for PR's to be merged.

## Typechecking

Typechecking is done with [TypeScript](https://www.typescriptlang.org/). In packages that have typescript enabled (e.g. have a `tsconfig.json`), the CI step will run the `typecheck` task. PR's will be blocked if this doesn't pass.

## Formatting

Formatting is done with [Prettier](https://prettier.io). The `format` task will overwrite files with the correct formatting, while the `format:check` task will only check files for correct formatting.

The CI will block PR's if `format:check` fails. If this occurs, run `pnpm run format` to update the formatting on all files. I also recommend using [Editor integrations](https://prettier.io/docs/en/editors.html) with Prettier to format as you write code.

## Release management

We use [changesets](https://github.com/changesets/changesets) to version manage the packages in this repo.

When creating a pr that needs to be rolled into a version release, do `npx changeset`, select the level of the version bump required and describe the changes for the change logs. DO NOT select `major` for releasing breaking changes without team approval.

To release:

Merge the version PR that the changeset bot created to bump the version numbers.
This will bump the versions of the packages and create a git tag for the release.
This will trigger a workflow to deploy them to AWS and/or publish to NPM, and create a new release on GitHub.

## React-Native Development

Reference of commands (run from the root of this project):
* `pnpm react-native codegen` rebuilds Android + iOS based on changes to those files
* `pnpm react-native watch` starts a watch process for rebuilding the RN SDK
* `pnpm react-native build` just builds the RN SDK
* `pnpm react-native test` runs the unit test suite
and for the Expo example
* `pnpm examples:expo ios` rebuilds the iOS bundle
* `pnpm examples:expo android` rebuilds the Android bundle
* `pnpm examples:expo dev` starts up the Metro server

## Environments

| Package             | Production                             | Staging                                |
| ------------------- | -------------------------------------- | -------------------------------------- |
| browser             | js.evervault.com/v2/index.js           | js.evervault.io/v2/index.js            |
| inputs (deprecated) | inputs.evervault.com/index.html        | inputs.evervault.io/index.html         |
| ui-components       | ui-components.evervault.com/index.html | ui-components.evervault.io/index.html |
| 3ds                 | 3ds.evervault.com/index.html           | 3ds.evervault.io/index.html            |
