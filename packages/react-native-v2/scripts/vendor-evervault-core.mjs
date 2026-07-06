#!/usr/bin/env node
// Vendors EvervaultCore's source directly into ios/vendor so native-evervault.podspec
// can compile it as plain source files. This avoids `SPM.dependency`, which causes
// duplicate-symbol linker errors under expo-modules-core's SPM integration
// (see expo/expo#37813), and avoids depending on CocoaPods trunk, which stops
// accepting new podspecs in Dec 2026.
//
// Runs at `prebuild` (local dev/build) and `prepack` (npm publish) so `pod install`
// never needs network access for this dependency.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const VENDORED_DEPENDENCIES = [
  {
    repo: "evervault/evervault-ios",
    tag: "2.1.0",
    sourcePath: "Sources/EvervaultCore",
    dest: "ios/vendor/EvervaultCore",
  },
];

function vendor({ repo, tag, sourcePath, dest }) {
  const name = repo.split("/").pop();
  const destPath = join(packageRoot, dest);
  const workDir = mkdtempSync(join(tmpdir(), `${name}-`));
  const tarballPath = join(workDir, `${name}.tar.gz`);

  try {
    execFileSync("curl", [
      "-sL",
      `https://github.com/${repo}/archive/refs/tags/${tag}.tar.gz`,
      "-o",
      tarballPath,
    ]);
    execFileSync("tar", ["-xzf", tarballPath, "-C", workDir]);

    rmSync(destPath, { recursive: true, force: true });
    mkdirSync(dirname(destPath), { recursive: true });
    renameSync(join(workDir, `${name}-${tag}`, sourcePath), destPath);

    console.log(`Vendored ${repo}@${tag}:${sourcePath} -> ${dest}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

for (const dependency of VENDORED_DEPENDENCIES) {
  vendor(dependency);
}
