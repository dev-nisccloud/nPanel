#!/usr/bin/env node
/**
 * Bulk-set Firebase App Hosting secrets from a .env file (production by default).
 *
 * Reads KEY=VALUE lines and runs:
 *   firebase apphosting:secrets:set KEY --data-file - --force
 * with stdin = optional "production" answer line (for backend prompt) + secret value.
 *
 * Usage:
 *   node scripts/set-apphosting-secrets.mjs [options] [path-to-.env]
 *   pnpm run apphosting:secrets
 *
 * Options:
 *   [path]              .env file path (default: apps/npanel/.env.production)
 *   --dry-run            Only list which secrets would be set; do not call Firebase
 *   --only KEY1,KEY2     Only set these keys (comma-separated). Others are skipped.
 *   --skip KEY1,KEY2     Skip these keys (comma-separated). Rest are set.
 *   --no-default-production  Do not send "production" as first line to stdin (use if your CLI doesn't prompt)
 *   --no-force           Do not pass --force to Firebase (may show more prompts)
 *
 * Default behavior:
 *   - Target: production (sends "production" as first line so Firebase's "production or local?" prompt gets production).
 *   - Uses --force so Firebase auto-creates secret, grants permissions, and can add to YAML.
 *
 * If a stored secret value incorrectly starts with "production\n", use --no-default-production and answer the prompt manually.
 *
 * Requires: run from repo root (where firebase.json is). Firebase CLI must be installed.
 */

import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const defaultEnvPath = path.join(repoRoot, "apps", "npanel", ".env.production");

function parseArgs() {
  const args = process.argv.slice(2);
  let envPath = defaultEnvPath;
  let dryRun = false;
  let onlyKeys = null;
  let skipKeys = new Set();
  let defaultProduction = true;
  let useForce = true;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--only" && args[i + 1]) {
      onlyKeys = new Set(args[++i].split(",").map((k) => k.trim()).filter(Boolean));
    } else if (a === "--skip" && args[i + 1]) {
      for (const k of args[++i].split(",").map((k) => k.trim()).filter(Boolean))
        skipKeys.add(k);
    } else if (a === "--no-default-production") {
      defaultProduction = false;
    } else if (a === "--no-force") {
      useForce = false;
    } else if (a === "--help" || a === "-h") {
      console.log(`
Usage: node scripts/set-apphosting-secrets.mjs [options] [path-to-.env]

Options:
  [path]                   .env file (default: apps/npanel/.env.production)
  --dry-run                List secrets that would be set; do not call Firebase
  --only KEY1,KEY2         Only set these keys
  --skip KEY1,KEY2         Skip these keys
  --no-default-production  Do not send "production" first (if CLI doesn't prompt)
  --no-force               Do not pass --force to Firebase
  -h, --help               Show this help

Examples:
  pnpm run apphosting:secrets
  node scripts/set-apphosting-secrets.mjs --dry-run
  node scripts/set-apphosting-secrets.mjs --only GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET apps/npanel/.env.production
`);
      process.exit(0);
    } else if (!a.startsWith("-")) {
      envPath = path.isAbsolute(a) ? a : path.resolve(repoRoot, a);
    }
  }

  return { envPath, dryRun, onlyKeys, skipKeys, defaultProduction, useForce };
}

function parseValue(val) {
  const s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1).replace(/\\(.)/g, "$1");
  return s;
}

function setSecret(name, value, options) {
  const { defaultProduction, useForce } = options;
  return new Promise((resolve, reject) => {
    const argv = [
      "apphosting:secrets:set",
      name,
      "--data-file",
      "-",
    ];
    if (useForce) argv.push("--force");

    const child = spawn("firebase", argv, {
      cwd: repoRoot,
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    });

    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));

    // Send "production" first so Firebase's "production or local?" prompt gets production as the answer.
    // Then send the actual secret value (consumed by --data-file -).
    if (defaultProduction) {
      child.stdin.write("production\n", "utf8", () => {
        child.stdin.write(value, "utf8", () => {
          child.stdin.end();
        });
      });
    } else {
      child.stdin.write(value, "utf8", () => {
        child.stdin.end();
      });
    }
  });
}

async function main() {
  const { envPath, dryRun, onlyKeys, skipKeys, defaultProduction, useForce } = parseArgs();

  if (!existsSync(envPath)) {
    console.error("Env file not found:", envPath);
    process.exit(1);
  }

  const rl = createInterface({
    input: createReadStream(envPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const entries = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    const value = parseValue(rawValue);
    if (!key) continue;
    if (onlyKeys && !onlyKeys.has(key)) continue;
    if (skipKeys.has(key)) continue;
    entries.push([key, value]);
  }

  if (entries.length === 0) {
    console.error("No KEY=VALUE entries to set in", envPath);
    if (onlyKeys?.size) console.error("  (--only filter may have excluded all)");
    process.exit(1);
  }

  if (dryRun) {
    console.error("Dry run: would set", entries.length, "secrets from", envPath);
    for (const [key] of entries) console.log("  ", key);
    console.error("Run without --dry-run to apply.");
    return;
  }

  console.error("Setting", entries.length, "secrets from", envPath);
  console.error("Target: production (default). Use --no-default-production if your CLI does not prompt.");
  const options = { defaultProduction, useForce };
  for (const [key, value] of entries) {
    process.stderr.write(`  ${key}... `);
    try {
      await setSecret(key, value, options);
      console.error("OK");
    } catch (e) {
      console.error("FAIL", e.message);
      process.exit(1);
    }
  }
  console.error("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
