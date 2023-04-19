import Client, { connect } from "@dagger.io/dagger";

connect(
  async (client: Client) => {
    const pkgKeys = ["browser", "inputs"] as const;

    const source = client
      .host()
      .directory(".", { exclude: ["node_modules/", ".pnpm-store/", "ci/"] });

    for (const pkg of pkgKeys) {
      const buildTar = source.file(`./build-image--${pkg}.tar`);
      const build = client.container().import(buildTar);

      await build.withExec(['pnpm', 'run', `e2e:test:${pkg}`]).exitCode();
    }
  },
  { LogOutput: process.stdout }
);
