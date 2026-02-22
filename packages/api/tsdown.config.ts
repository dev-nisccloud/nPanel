import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	sourcemap: true,
	// Disable .d.ts emit: inferred appRouter type references @nPanel/db Prisma runtime (TS2742).
	// Package exposes "types": "./src/index.ts" so consumers use source types.
	dts: false,
	bundle: false,
	// Skip resolving/bundling node_modules to reduce memory during build (avoids OOM in CI/Docker)
	skipNodeModulesBundle: true,
	// Mark heavy deps external so they are not parsed; reduces heap usage
	external: [
		"@react-pdf/renderer",
		"google-ads-api",
		"googleapis",
		/^@nPanel\//,
	],
	// Rolldown does not accept "define" / "inject"; strip if tsdown passes them (avoids "Invalid key" warning).
	inputOptions(opts) {
		// @ts-expect-error - these may be passed by tsdown but are invalid in Rolldown
		delete opts.define;
		delete opts.inject;
		return opts;
	},
});
