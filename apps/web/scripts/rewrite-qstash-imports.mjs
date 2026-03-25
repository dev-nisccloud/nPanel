import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/next-api-routes");

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.name.endsWith(".ts")) yield full;
  }
}

let changed = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  const o = s;
  s = s.replace(/from ['"]@upstash\/qstash\/nextjs['"]/g, 'from "@/lib/qstash-verify"');
  if (s !== o) {
    fs.writeFileSync(file, s, "utf8");
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
