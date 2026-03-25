/**
 * One-time / maintenance: replace legacy Next app-router path aliases with React Router routes tree.
 * Run from apps/web: node scripts/rewrite-legacy-app-imports.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, "../src");

const REPLACEMENTS = [
  // Dynamic segments: [id] → $id (must be before generic agency/)
  [/\@\/app\/\(main\)\/agency\/quotations\/\[id\]\//g, "@/routes/agency/quotations/$id/"],
  [/\@\/app\/\(main\)\/agency\/invoices\/\[id\]\//g, "@/routes/agency/invoices/$id/"],
  [/\.\.\/app\/\(main\)\/agency\//g, "@/routes/agency/"],
  [/\@\/app\/\(main\)\/agency\//g, "@/routes/agency/"],
  [/\@\/app\/\(main\)\/\[slug\]\//g, "@/routes/$slug/"],
];

function* walkTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".react-router") continue;
      yield* walkTsFiles(full);
    } else if (/\.(tsx|ts)$/.test(e.name)) {
      yield full;
    }
  }
}

let changed = 0;
for (const file of walkTsFiles(srcRoot)) {
  let text = fs.readFileSync(file, "utf8");
  const orig = text;
  for (const [re, to] of REPLACEMENTS) {
    text = text.replace(re, to);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
    console.log(path.relative(srcRoot, file));
  }
}
console.log(`Done. Updated ${changed} files.`);
