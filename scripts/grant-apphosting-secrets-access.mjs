#!/usr/bin/env node
/**
 * Grant the App Hosting backend access to all secrets referenced in apphosting.yaml.
 * Run this once after setting secrets (pnpm run apphosting:secrets) so the build and
 * runtime can read them. Fixes: "Error resolving secret version ... PermissionDenied"
 *
 * Usage:
 *   node scripts/grant-apphosting-secrets-access.mjs [options]
 *   pnpm run apphosting:secrets:grant
 *
 * Options:
 *   --backend NAME   Backend name (default: nisccloud-npanel, from firebase apphosting:backends:list)
 *   --yaml PATH     Path to apphosting.yaml (default: apps/npanel/apphosting.yaml)
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultYamlPath = path.join(repoRoot, "apps", "npanel", "apphosting.yaml");
const defaultBackend = "nisccloud-npanel";

function parseArgs() {
  const args = process.argv.slice(2);
  let backend = defaultBackend;
  let yamlPath = defaultYamlPath;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--backend" && args[i + 1]) {
      backend = args[++i];
    } else if (args[i] === "--yaml" && args[i + 1]) {
      yamlPath = path.isAbsolute(args[i + 1]) ? args[i + 1] : path.join(repoRoot, args[++i]);
    }
  }
  return { backend, yamlPath };
}

function extractSecretNames(yamlPath) {
  const content = readFileSync(yamlPath, "utf8");
  const names = [];
  const secretRe = /^\s*secret:\s*([A-Za-z0-9_]+)\s*$/gm;
  let m;
  while ((m = secretRe.exec(content)) !== null) {
    const name = m[1];
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function main() {
  const { backend, yamlPath } = parseArgs();

  try {
    const secretNames = extractSecretNames(yamlPath);
    if (secretNames.length === 0) {
      console.error("No secret references found in", yamlPath);
      process.exit(1);
    }

    // grantaccess accepts comma-separated names
    const secretList = secretNames.join(",");
    console.error("Granting backend '%s' access to %d secrets: %s", backend, secretNames.length, secretNames.join(", "));

    const result = spawnSync(
      "firebase",
      ["apphosting:secrets:grantaccess", secretList, "--backend", backend],
      { cwd: repoRoot, stdio: "inherit", shell: true }
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    console.error("Done. Re-run after adding new secrets to apphosting.yaml.");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

main();
