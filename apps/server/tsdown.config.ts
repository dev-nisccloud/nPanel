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
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
});
