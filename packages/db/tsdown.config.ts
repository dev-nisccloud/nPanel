import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	sourcemap: true,
	dts: true,
	// Rolldown does not accept "define"; strip it if tsdown passes it (avoids "Invalid key" warning).
	inputOptions(opts) {
		// @ts-expect-error - define may be passed by tsdown but is invalid in Rolldown
		delete opts.define;
		return opts;
	},
});
