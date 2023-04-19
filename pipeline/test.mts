import Client, { connect } from "@dagger.io/dagger";

connect(
  async (client: Client) => {
    const pkg = process.env.PKG as string;

    const source = client
      .host()
      .directory(".", { exclude: ["node_modules/", ".pnpm-store/", "ci/"] });

    const buildTar = source.file(`./ci/images/build-image--${pkg}.tar`);
    const build = client.container().import(buildTar);

    await build.withExec(["pnpm", "run", `e2e:test:${pkg}`]).exitCode();
  },
  { LogOutput: process.stdout }
);
