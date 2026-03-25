/**
 * Replace Next.js `next/server` types with standard Web Fetch API (Request / Response).
 * Run from apps/web: node scripts/migrate-next-api-routes-to-web-fetch.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../src/next-api-routes");

function* walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) yield* walk(full);
    else if (name.name.endsWith(".ts")) yield full;
  }
}

let n = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  s = s.replace(/^import\s+[^;]*from\s+["']next\/server["'];?\r?\n?/gm, "");

  s = s.replace(/^export const dynamic = [^;]+;\r?\n?/gm, "");
  s = s.replace(/^export const runtime = [^;]+;\r?\n?/gm, "");
  s = s.replace(/^export const maxDuration = [^;]+;\r?\n?/gm, "");

  s = s.replace(/\bNextResponse\.json\b/g, "Response.json");
  s = s.replace(/\bNextResponse\.redirect\b/g, "Response.redirect");
  s = s.replace(/\bnew NextResponse\b/g, "new Response");
  s = s.replace(/\bNextRequest\b/g, "Request");

  s = s.replace(/\brequest\.nextUrl\.searchParams\b/g, "new URL(request.url).searchParams");
  s = s.replace(/\breq\.nextUrl\.searchParams\b/g, "new URL(req.url).searchParams");

  if (s !== orig) {
    fs.writeFileSync(file, s, "utf8");
    n++;
    console.log(path.relative(root, file));
  }
}
console.log(`Updated ${n} files under next-api-routes.`);
