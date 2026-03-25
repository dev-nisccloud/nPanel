import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, "../src");

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      yield full;
    }
  }
}

let changed = 0;
for (const file of walk(srcRoot)) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  text = text.replace(/^\/\* eslint-disable @next\/next\/no-img-element \*\/\r?\n/gm, "");
  text = text.replace(/^\s*\{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/\}\r?\n/gm, "");
  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
  }
}

console.log(`Updated ${changed} files.`);
