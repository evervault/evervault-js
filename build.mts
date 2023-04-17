import Client, { connect } from "@dagger.io/dagger";

// initialize Dagger client
connect(async (client: Client) => {
  const source = client
    .host()
    .directory(".", { exclude: ["node_modules/", ".pnpm-store/"] });

  const cache = client.cacheVolume("pnpm-store");

  const nodeWithPnpmAndTurbo = client
    .container()
    .from("node:18-slim")
    .withExec(["corepack", "enable"])
    .withExec(["corepack", "prepare", "pnpm@8.2.0", "--activate"])
    .withExec(["pnpm", "add", "turbo", "--global"]);

  const browserPruned = nodeWithPnpmAndTurbo
    .withMountedDirectory("/src", source)
    .withWorkdir("/src")
    .withExec(["turbo", "prune", "--scope=browser", "--docker"]);

  const runner = node
    .withMountedDirectory("/src", source)
    .withMountedCache("/src/.pnpm-store", cache)
    .withWorkdir("/src")
    .withExec(["corepack", "enable"])
    .withExec(["corepack", "prepare", "pnpm@8.2.0", "--activate"])
    .withExec(["pnpm", "config", "set", "store-dir", ".pnpm-store"])
    .withExec(["pnpm", "install"])
    .withExec(["pnpm", "run", "ci:prune:browser"]);

  // run build
  await runner.withExec(["pnpm", "build"]).exitCode();

  // run tests
  await runner.withExec(["pnpm", "run", "e2e:test"]).exitCode();
});
