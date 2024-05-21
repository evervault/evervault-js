# evervault-inputs

Repo for the backend for Evervault Inputs.

Setup node with a node version manager like `fnm` or `nvm`.

Install pnpm version 9 with `corepack enable && corepack prepare --activate pnpm@latest-9`

To build: `pnpm build`
To run locally: `pnpm run dev` for development or `pnpm run preview` for production

# E2E Testing

You'll need to install playwright browser dependencies to run the e2e tests.

```bash
npx playwright install
```

Then you can run the tests with

```bash
pnpm test
```

For more information on playwright, see https://playwright.dev/docs/intro
