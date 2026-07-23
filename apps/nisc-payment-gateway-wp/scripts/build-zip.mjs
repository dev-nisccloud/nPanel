import { existsSync, readFileSync } from "node:fs";
import { mkdir, rm, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = String(process.env.NISC_PG_VERSION || pkg.version || "0.1.0");
const pluginSlug = "nisc-payment-gateway";
const distDir = path.join(root, "dist");
const zipName = `${pluginSlug}-${version}.zip`;
const zipPath = path.join(distDir, zipName);
const stagingRoot = path.join(distDir, "staging");
const stagingPlugin = path.join(stagingRoot, pluginSlug);

const include = [
  "nisc-payment-gateway.php",
  "readme.txt",
  "includes",
  "assets",
  "languages",
];

function assertVersionSynced() {
  const mainPhp = readFileSync(path.join(root, "nisc-payment-gateway.php"), "utf8");
  const headerMatch = mainPhp.match(/^\s*\*\s*Version:\s*(.+)$/m);
  const defineMatch = mainPhp.match(/define\(\s*'NISC_PG_VERSION',\s*'([^']+)'\s*\)/);
  const readme = readFileSync(path.join(root, "readme.txt"), "utf8");
  const stableMatch = readme.match(/Stable tag:\s*(.+)/i);

  const headerVersion = headerMatch?.[1]?.trim();
  const defineVersion = defineMatch?.[1]?.trim();
  const stableVersion = stableMatch?.[1]?.trim();

  const mismatches = [];
  if (headerVersion !== version) mismatches.push(`plugin header Version (${headerVersion})`);
  if (defineVersion !== version) mismatches.push(`NISC_PG_VERSION (${defineVersion})`);
  if (stableVersion !== version) mismatches.push(`readme Stable tag (${stableVersion})`);

  if (mismatches.length) {
    console.error(
      `Version mismatch: package.json is ${version}, but differ: ${mismatches.join(", ")}`
    );
    process.exit(1);
  }
}

assertVersionSynced();

await mkdir(distDir, { recursive: true });
await rm(stagingRoot, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(stagingPlugin, { recursive: true });

for (const item of include) {
  const from = path.join(root, item);
  if (!existsSync(from)) {
    console.warn(`Skipping missing path: ${item}`);
    continue;
  }
  await cp(from, path.join(stagingPlugin, item), { recursive: true });
}

// WordPress expects a single top-level folder inside the ZIP.
const isWin = process.platform === "win32";
let result;

if (isWin) {
  result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${stagingPlugin}' -DestinationPath '${zipPath}' -Force`,
    ],
    { encoding: "utf8" }
  );
} else {
  result = spawnSync(
    "zip",
    ["-r", zipPath, pluginSlug],
    { cwd: stagingRoot, encoding: "utf8" }
  );
}

await rm(stagingRoot, { recursive: true, force: true });

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "zip failed");
  process.exit(1);
}

console.log(`Created ${zipPath}`);
console.log(`Version ${version}`);
