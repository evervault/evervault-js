#!/usr/bin/env node

// Installs each package we publish to npm into an empty project, the way a
// customer would, alongside the oldest peer versions we support. Fails if npm
// can't install it, or if npm reports a peer dependency conflict (ERESOLVE),
// which it only warns about by default.
//
// Keep PACKAGES in sync with the npm-publish jobs in .github/workflows/release.yml.
// The packages must be built first.

import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const PACKAGES = [
  { dir: "packages/card-validator", peers: [] },
  { dir: "packages/js", peers: [] },
  { dir: "packages/react", peers: ["react@18.3.1"] },
  {
    dir: "packages/react-native-v2",
    // Installed together, as the version it depends on may not be on npm yet
    // in a Version Packages PR.
    workspaceDependencies: ["packages/card-validator"],
    peers: [
      "react@18.3.1",
      "react-native@0.76.9",
      "react-native-webview@13.12.5",
    ],
  },
];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function pack(packageDir, destination) {
  mkdirSync(destination);
  const result = run(
    "pnpm",
    ["pack", "--pack-destination", destination],
    join(repoRoot, packageDir)
  );
  if (!result.ok) {
    throw new Error(`Failed to pack ${packageDir}:\n${result.output}`);
  }

  return join(destination, readdirSync(destination)[0]);
}

function checkInstall({ dir, workspaceDependencies = [], peers }, tarballs) {
  const project = mkdtempSync(join(tmpdir(), "npm-install-check-"));
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({ name: "npm-install-check", private: true })
  );

  const packages = [dir, ...workspaceDependencies].map((d) => tarballs.get(d));
  const result = run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      ...peers,
      ...packages,
    ],
    project
  );
  rmSync(project, { recursive: true, force: true });

  const peerConflict = result.output.includes("ERESOLVE");
  return { ok: result.ok && !peerConflict, output: result.output };
}

const packDir = mkdtempSync(join(tmpdir(), "npm-install-check-packs-"));
const tarballs = new Map(
  PACKAGES.map(({ dir }) => [
    dir,
    pack(dir, join(packDir, dir.replaceAll("/", "-"))),
  ])
);

const failures = PACKAGES.filter((pkg) => {
  const peers = pkg.peers.length > 0 ? ` with ${pkg.peers.join(", ")}` : "";
  console.log(`Installing ${pkg.dir}${peers}`);

  const { ok, output } = checkInstall(pkg, tarballs);
  if (!ok) {
    console.error(output);
  }
  return !ok;
});
rmSync(packDir, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(
    `\nnpm install failed or reported a peer dependency conflict for: ${failures
      .map(({ dir }) => dir)
      .join(", ")}`
  );
  process.exit(1);
}

console.log("\nAll packages install cleanly.");
