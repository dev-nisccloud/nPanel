import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  skipNodeModulesBundle: true,
  noExternal: [/@npanel\/.*/],
  external: ["google-ads-api", "googleapis", "google-proto-files"],
});
