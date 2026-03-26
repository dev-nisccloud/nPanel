// @ts-nocheck
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/**/*.ts",
  sourcemap: true,
  dts: false,
  bundle: false,
  skipNodeModulesBundle: true,
  external: [
    "@react-pdf/renderer",
    "google-ads-api",
    "googleapis",
    // /^@npanel\// is REMOVED — do not add it back
  ],
  inputOptions(opts) {
    // @ts-expect-error
    delete opts.define;
    delete opts.inject;
    return opts;
  },
});