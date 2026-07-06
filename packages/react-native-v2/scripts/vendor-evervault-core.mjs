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

import packageJson from "../package.json" with { type: "json" };

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function vendor({ name, repo, version, sourcePath }) {
  const destPath = join(packageRoot, "ios/vendor", name);

  const repoName = repo.split("/").pop();
  const workDir = mkdtempSync(join(tmpdir(), `${repoName}-`));
  const tarballPath = join(workDir, `${repoName}.tar.gz`);
  
  try {
    // Download & extract the tarball
    execFileSync("curl", [
      "-sL",
      `https://github.com/${repo}/archive/refs/tags/${version}.tar.gz`,
      "-o",
      tarballPath,
    ]);
    execFileSync("tar", ["-xzf", tarballPath, "-C", workDir]);

    // Move the source files to the destination path
    rmSync(destPath, { recursive: true, force: true });
    mkdirSync(dirname(destPath), { recursive: true });
    console.log(join(workDir, `${repoName}-${version}`, sourcePath))
    renameSync(join(workDir, `${repoName}-${version}`, sourcePath), destPath);

    console.log(`Vendored ${repo}@${version}:${sourcePath} -> ${name}`);
  } finally {
    // Clean up the working directory
    rmSync(workDir, { recursive: true, force: true });
  }
}

const vendoredDependencies = packageJson.ios?.spmDependencies ?? [];
for (const dependency of vendoredDependencies) {
  vendor(dependency);
}
