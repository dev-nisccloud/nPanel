/**
 * .env.etims-certification is the source of truth.
 * This script no longer overwrites it with a previous app's secrets.
 *
 *   bun run etims:certification:env
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dest = path.join(root, ".env.etims-certification");

if (!existsSync(dest)) {
	console.error("Missing", dest);
	console.error("Copy the new Gava Connect app values into that file (OAuth, Application Test PIN, serial, branch).");
	process.exit(1);
}

console.log("Using existing", dest);
console.log("Edit that file for a new Gava Connect test app.");
console.log("The live nPanel API keeps using apps/server/.env — these files stay separate.");
