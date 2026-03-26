import { defineConfig } from "tsdown";  // ← add this line

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./api",
  outExtension: () => ({ js: ".js" }),
  clean: true,
  skipNodeModulesBundle: false,
  noExternal: [/@npanel\/.*/, "react-email-starter", /@react-email\/.*/, "resend"],
  external: ["google-ads-api", "googleapis", "google-proto-files"],
  banner: `
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);
`,
});