import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/server.ts", "src/web.ts"],
    format: "esm",
    outDir: "./dist",
    sourcemap: true,
    dts: false,
    bundle: false,
    skipNodeModulesBundle: true,
});