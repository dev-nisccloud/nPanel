import { defineConfig } from "tsdown";

export default defineConfig({
    entry: "src/**/*.ts",
    format: "esm",
    outDir: "./dist",
    sourcemap: true,
    dts: false,
    bundle: false,
    skipNodeModulesBundle: true,
    external: [/^@npanel\//],
});