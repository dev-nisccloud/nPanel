import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  skipNodeModulesBundle: true,
  noExternal: [/@npanel\/.*/],
  external: ["google-ads-api", "googleapis", "google-proto-files"],
  banner: `
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);
`,
});
