import * as core from "@actions/core";
import { getOctokit } from "@actions/github";
import {
  S3Client,
  ListObjectVersionsCommand,
  DeleteObjectCommand,
  type ObjectVersion,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

interface RollbackOptions {
  readonly bucket: string;
  readonly folderPrefix: string;
  readonly dryRun: boolean;
  readonly filePattern: RegExp;
  readonly maxFiles: number;
}

interface VersionGroup {
  readonly key: string;
  readonly versions: readonly ObjectVersion[];
}

interface RollbackResult {
  readonly success: boolean;
  readonly count: number;
  readonly error?: Error;
}

const normalizeFolderPrefix = (prefix: string): string =>
  prefix.endsWith("/") ? prefix : `${prefix}/`;

const groupVersionsByKey = (
  versions: readonly ObjectVersion[]
): VersionGroup[] =>
  Array.from(
    versions.reduce((acc, version) => {
      const key = version.Key || "";
      const existing = acc.get(key) || [];
      return acc.set(key, [...existing, version]);
    }, new Map<string, ObjectVersion[]>())
  ).map(([key, versions]) => ({ key, versions }));

const sortVersionsByDate = (
  versions: readonly ObjectVersion[]
): ObjectVersion[] =>
  [...versions].sort(
    (a, b) =>
      (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
  );

const filterValidGroups = (
  groups: readonly VersionGroup[],
  filePattern: RegExp
): VersionGroup[] =>
  groups.filter(
    (group) =>
      !group.key.endsWith("/") &&
      filePattern.test(group.key) &&
      group.versions.length > 1
  );

async function listVersions(bucket: string, prefix: string) {
  try {
    const response = await s3Client.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        Prefix: prefix,
      })
    );
    return { success: true, versions: response.Versions || [] };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

async function deleteVersion(
  bucket: string,
  key: string,
  versionId: string
): Promise<boolean> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
        VersionId: versionId,
      })
    );
    return true;
  } catch (error) {
    core.error(`Failed to delete version: ${error}`);
    return false;
  }
}

async function processVersionGroup(
  options: RollbackOptions,
  group: VersionGroup
): Promise<boolean> {
  const sortedVersions = sortVersionsByDate(group.versions);
  const [currentVersion, previousVersion] = sortedVersions;

  core.info(
    `Processing ${group.key}:
     Current: ${currentVersion.VersionId}
     Previous: ${previousVersion.VersionId}`
  );

  if (options.dryRun) {
    core.info(`[DRY RUN] Would rollback ${group.key}`);
    return true;
  }

  const success = await deleteVersion(
    options.bucket,
    group.key,
    currentVersion.VersionId || ""
  );

  if (success) {
    core.info(`Successfully rolled back ${group.key}`);
  }

  return success;
}

async function rollbackFolder(
  options: RollbackOptions
): Promise<RollbackResult> {
  const prefix = normalizeFolderPrefix(options.folderPrefix);
  const versionsResult = await listVersions(options.bucket, prefix);

  if (!versionsResult.success) {
    return {
      success: false,
      count: 0,
      error: versionsResult.error,
    };
  }

  const processGroups = async (groups: readonly VersionGroup[]) => {
    const results = await Promise.all(
      groups.map((group) => processVersionGroup(options, group))
    );
    return results.filter(Boolean).length;
  };

  const validGroups = filterValidGroups(
    groupVersionsByKey(versionsResult?.versions ?? []),
    options.filePattern
  ).slice(0, options.maxFiles);

  const processedCount = await processGroups(validGroups);

  return {
    success: true,
    count: processedCount,
  };
}

enum Bucket {
  JsSdk = "js-sdk",
  ThreeDS = "3ds",
  UiComponents = "ui-components",
  Inputs = "inputs",
}

enum Stage {
  Production = "production",
  Staging = "staging",
}

function getBucketConfig(
  bucket: Bucket,
  stage: Stage,
  dryRun: boolean
): RollbackOptions {
  switch (bucket) {
    case Bucket.JsSdk:
      return {
        bucket: `ev-${stage}-js-sdk-src-code-us-east-1`,
        folderPrefix: "v2/",
        dryRun,
        filePattern: /.*\.[j|t]s$/,
        maxFiles: 10,
      };
    case Bucket.ThreeDS:
      return {
        bucket: `ev-${stage}-3ds-src-code-us-east-1`,
        folderPrefix: "/",
        dryRun,
        filePattern: /index\.html$/,
        maxFiles: 1,
      };
    case Bucket.UiComponents:
      return {
        bucket: `ev-${stage}-ui-components-src-code-us-east-1`,
        folderPrefix: "/",
        dryRun,
        filePattern: /index\.html$/,
        maxFiles: 1,
      };
    case Bucket.Inputs:
      return {
        bucket: `ev-${stage}-inputs-src-code-us-east-1`,
        folderPrefix: "v2/",
        dryRun,
        filePattern: /.*\.html$/,
        maxFiles: 2,
      };
    default:
      throw new Error(`Unsupported bucket: ${bucket}`);
  }
}

async function updateLatestReleaseTitle(
  token: string,
  bucket: Bucket
): Promise<void> {
  const octokit = getOctokit(token);
  const context = github.context;
  const packagePrefix = "@evervault/";

  // Map bucket to package name
  const packageMap: Record<Bucket, string> = {
    [Bucket.JsSdk]: "js-sdk",
    [Bucket.ThreeDS]: "3ds",
    [Bucket.UiComponents]: "ui-components",
    [Bucket.Inputs]: "inputs",
  };

  const packageName = `${packagePrefix}${packageMap[bucket]}`;

  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 10,
    });

    const relevantRelease = releases.find((release) =>
      release.tag_name.startsWith(packageName)
    );

    if (relevantRelease) {
      if (!relevantRelease.name.startsWith("[reverted]")) {
        await octokit.rest.repos.updateRelease({
          owner: context.repo.owner,
          repo: context.repo.repo,
          release_id: relevantRelease.id,
          name: `[reverted] ${relevantRelease.name}`,
        });
        core.info(
          `Updated release title for ${packageName}: [reverted] ${relevantRelease.name}`
        );
      }
    } else {
      core.info(`No release found for package ${packageName}`);
    }
  } catch (error) {
    core.error(`Failed to update release title for ${packageName}: ${error}`);
    throw error;
  }
}

async function run(): Promise<void> {
  const stage = core.getInput("stage", { required: true }) as Stage;
  const bucket = core.getInput("bucket", { required: true }) as Bucket;
  const dryRun = core.getBooleanInput("dry-run");

  const result = await rollbackFolder(getBucketConfig(bucket, stage, dryRun));

  if (!result.success) {
    core.setFailed(result.error?.message || "Unknown error occurred");
    return;
  }

  if (!dryRun) {
    await updateLatestReleaseTitle(core.getInput("github-token"), bucket);
  }

  core.setOutput("processed-files", result.count);
}

run().catch((error) => {
  core.setFailed(error.message);
});
