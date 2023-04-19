import Client, { connect } from "@dagger.io/dagger";

connect(
  async (client: Client) => {
    const pkg = process.env.PKG as string;

    const source = client
      .host()
      .directory(".", { exclude: ["node_modules/", ".pnpm-store/", "ci/", ".env"] });

    const nodeWithPnpmAndTurbo = client
      .container()
      .from("node:18")
      .withExec(["corepack", "enable"])
      .withExec(["corepack", "prepare", "pnpm@latest-8", "--activate"]);

    const pnpmCache = client.cacheVolume(`pnpm-cache--${pkg}`);

    const prunedDirImage = nodeWithPnpmAndTurbo
      .withMountedDirectory("/src", source)
      .withWorkdir("/src")
      .withExec([
        "npx",
        "turbo",
        "prune",
        `--scope=@evervault/${pkg}`,
        "--docker",
      ]);

    const installImage = nodeWithPnpmAndTurbo
      .withDirectory("/src", prunedDirImage.directory("/src/out/json"))
      .withFile(
        "/src/pnpm-lock.yaml",
        prunedDirImage.file("/src/out/pnpm-lock.yaml")
      )
      .withMountedCache("/src/.pnpm-store", pnpmCache)
      .withWorkdir("/src")
      .withExec(["pnpm", "config", "set", "store-dir", ".pnpm-store"])
      .withExec(["pnpm", "install", "--frozen-lockfile"]);

    const buildDir = installImage
      .withDirectory("/src", prunedDirImage.directory("/src/out/full"), {
        exclude: ["**/node_modules/**"],
      })
      .withWorkdir("/src")
      .withExec(["pnpm", "run", `build:${pkg}`]);

    await buildDir.export(`./build-image--${pkg}.tar`);
  },
  { LogOutput: process.stdout }
);
