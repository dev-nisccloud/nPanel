/**
 * Idempotent: replaces `import { toast } from "sonner"` with @/components/ui/sonner under a routes subtree.
 * Run from apps/web: `node scripts/replace-agency-sonner-imports.mjs` (defaults to src/routes/agency)
 * Or: `node scripts/replace-agency-sonner-imports.mjs '$slug'`  (PowerShell: use single quotes around $slug)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subdir = process.argv[2] ?? "agency";
const agencyRoot = path.join(__dirname, "../src/routes", subdir);
const from = 'import { toast } from "sonner";';
const to = 'import { toast } from "@/components/ui/sonner";';

let count = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(ent.name)) {
      const s = fs.readFileSync(p, "utf8");
      if (!s.includes(from)) continue;
      fs.writeFileSync(p, s.split(from).join(to));
      count++;
      console.log(path.relative(path.join(__dirname, ".."), p));
    }
  }
}
if (!fs.existsSync(agencyRoot)) {
  console.error(`Path not found: ${agencyRoot}`);
  process.exit(1);
}
walk(agencyRoot);
console.log(`Updated ${count} files under src/routes/${subdir}.`);
