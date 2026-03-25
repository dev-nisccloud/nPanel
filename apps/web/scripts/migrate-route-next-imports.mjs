/**
 * Rewrites common Next.js navigation imports under a routes subtree (default: agency).
 * Usage from apps/web: `node scripts/migrate-route-next-imports.mjs` or `node scripts/migrate-route-next-imports.mjs '$slug'`
 * Does not handle next/image, redirect, router.replace/back — fix those separately.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const subdir = process.argv[2] ?? "agency";
const root = join(process.cwd(), "src/routes", subdir);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) out.push(p);
  }
}

const files = [];
if (!existsSync(root)) {
  console.error("Not found:", root);
  process.exit(1);
}
walk(root, files);

for (const f of files) {
  let s = readFileSync(f, "utf8");
  if (!s.includes("next/")) continue;
  const orig = s;

  s = s.replace(/^import Link from "next\/link";?\s*$/gm, 'import { Link } from "react-router";');
  s = s.replace(/<Link href=/g, "<Link to=");
  s = s.replace(
    /import \{ useParams, useRouter, usePathname \} from "next\/navigation"/g,
    'import { useParams, useNavigate, useLocation } from "react-router"',
  );
  s = s.replace(
    /import \{ useRouter, useSearchParams \} from "next\/navigation"/g,
    'import { useNavigate, useSearchParams } from "react-router"',
  );
  s = s.replace(/import \{ useRouter \} from "next\/navigation"/g, 'import { useNavigate } from "react-router"');
  s = s.replace(/import \{ useSearchParams \} from "next\/navigation"/g, 'import { useSearchParams } from "react-router"');
  s = s.replace(
    /import \{ useParams, useRouter \} from "next\/navigation"/g,
    'import { useParams, useNavigate } from "react-router"',
  );
  s = s.replace(
    /import \{ useParams, useRouter, useSearchParams \} from "next\/navigation"/g,
    'import { useParams, useNavigate, useSearchParams } from "react-router"',
  );
  s = s.replace(
    /import \{ useRouter, useSearchParams, usePathname \} from "next\/navigation"/g,
    'import { useNavigate, useSearchParams, useLocation } from "react-router"',
  );
  s = s.replace(
    /import \{ useRouter, usePathname \} from "next\/navigation"/g,
    'import { useNavigate, useLocation } from "react-router"',
  );
  s = s.replace(
    /import \{ usePathname, useRouter \} from "next\/navigation"/g,
    'import { useNavigate, useLocation } from "react-router"',
  );
  s = s.replace(
    /import \{ usePathname, useSearchParams \} from "next\/navigation"/g,
    'import { useLocation, useSearchParams } from "react-router"',
  );
  s = s.replace(
    /import \{ usePathname \} from "next\/navigation"/g,
    'import { useLocation } from "react-router"',
  );
  s = s.replace(
    /import \{ useParams \} from "next\/navigation"/g,
    'import { useParams } from "react-router"',
  );
  s = s.replace(/const router = useRouter\(\)/g, "const navigate = useNavigate()");
  s = s.replace(/const searchParams = useSearchParams\(\)/g, "const [searchParams] = useSearchParams()");
  s = s.replace(/router\.push\(/g, "navigate(");
  s = s.replace(/const pathname = usePathname\(\)/g, "const { pathname } = useLocation()");
  s = s.replace(/const path = usePathname\(\)/g, "const { pathname: path } = useLocation()");

  if (s !== orig) {
    writeFileSync(f, s);
    console.log("updated", f.replace(process.cwd(), ""));
  }
}
