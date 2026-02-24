#!/usr/bin/env node
/**
 * Bulk-set Firebase App Hosting secrets from a .env file.
 * Reads KEY=VALUE lines and runs: firebase apphosting:secrets:set KEY --data-file -
 * so values are piped via stdin (never written to disk).
 *
 * Usage: node scripts/set-apphosting-secrets.mjs [path-to-.env]
 * Default path: apps/npanel/.env.production
 *
 * Requires: run from repo root (where firebase.json is). Firebase CLI must be installed.
 */

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const defaultEnvPath = path.join(repoRoot, "apps", "npanel", ".env.production");

const envPath = process.argv[2] ?? defaultEnvPath;

function parseValue(val) {
  const s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1).replace(/\\(.)/g, "$1");
  return s;
}

function setSecret(name, value) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "firebase",
      ["apphosting:secrets:set", name, "--data-file", "-"],
      {
        cwd: repoRoot,
        stdio: ["pipe", "inherit", "inherit"],
        shell: true,
      }
    );
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    child.stdin.write(value, "utf8", () => {
      child.stdin.end();
    });
  });
}

async function main() {
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
    entries.push([key, value]);
  }

  if (entries.length === 0) {
    console.error("No KEY=VALUE entries found in", envPath);
    process.exit(1);
  }

  console.error("Setting", entries.length, "secrets from", envPath);
  for (const [key, value] of entries) {
    process.stderr.write(`  ${key}... `);
    try {
      await setSecret(key, value);
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
