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
import { mkdtempSync, rmSync, mkdirSync, renameSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import packageJson from "../package.json" with { type: "json" };

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function getSwiftPackage(id) {
  const resolvedStr = readFileSync(join(packageRoot, "Package.resolved"), "utf8");
  const resolved = JSON.parse(resolvedStr);
  const pin = resolved.pins.find(pin => pin.identity === id);
  if (!pin) {
    return null;
  }

  return {
    url: pin.location,
    version: pin.state.version,
  }
}

function vendor({ id, url, version, paths }) {
  const repoUrl = url.replace(/\.git$/, "");
  const workDir = mkdtempSync(join(tmpdir(), `${id}-`));
  const tarballPath = join(workDir, `${id}.tar.gz`);
  
  try {
    // Download & extract the tarball
    execFileSync("curl", [
      "-sL",
      `${repoUrl}/archive/refs/tags/${version}.tar.gz`,
      "-o",
      tarballPath,
    ]);
    execFileSync("tar", ["-xzf", tarballPath, "-C", workDir]);
    console.log(`✅ Vendored ${id}@${version}`)

    // Move the source files to the destination path
    for (const sourcePath of paths) {
      const name = sourcePath.split("/").pop();
      const destPath = join(packageRoot, "ios/vendor", name);

      rmSync(destPath, { recursive: true, force: true });
      mkdirSync(dirname(destPath), { recursive: true });
      renameSync(join(workDir, `${id}-${version}`, sourcePath), destPath);

      console.log(`${sourcePath} -> ios/vendor/${name}`);
    }
  } finally {
    // Clean up the working directory
    rmSync(workDir, { recursive: true, force: true });
  }
}

const vendoredPackages = packageJson.swiftDependencies ?? {};

for (const [id, paths] of Object.entries(vendoredPackages)) {
  const swiftPackage = getSwiftPackage(id);

  if (!swiftPackage) {
    console.error(`🚨 Could not find ${id} in Package.resolved`);
    console.error(`You need to add the dependency to the Package.swift file,\nthen run \`swift build\` to re-generate the Package.resolved file.`);
    continue;
  }

  vendor({
    id,
    url: swiftPackage.url,
    version: swiftPackage.version,
    paths,
  });
}