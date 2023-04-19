import Client, { connect } from "@dagger.io/dagger";

connect(
  async (client: Client) => {
    const pkg = process.env.PKG as string;

    const appUuid = client.setSecret("app-uuid", process.env["EV_APP_UUID"] as string);
    const teamUuid = client.setSecret("team-uuid", process.env["EV_TEAM_UUID"] as string);
    const apiKey = client.setSecret("ev-decrypt", process.env["EV_DECRYPT_FN_KEY"] as string);

    const source = client
      .host()
      .directory(".", { exclude: ["node_modules/", ".pnpm-store/", "ci/"] });

    const buildTar = source.file(`./build-image--${pkg}.tar`);
    const build = client.container().import(buildTar)
      .withSecretVariable("EV_APP_UUID", appUuid)
      .withSecretVariable("EV_TEAM_UUID", teamUuid)
      .withSecretVariable("EV_DECRYPT_FN_KEY", apiKey)
      .withSecretVariable("VITE_EV_APP_UUID", appUuid)
      .withSecretVariable("VITE_EV_TEAM_UUID", teamUuid)


    await build.withExec(["pnpm", "run", `e2e:test:${pkg}`]).exitCode();
  },
  { LogOutput: process.stdout }
);
