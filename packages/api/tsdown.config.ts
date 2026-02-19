import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	sourcemap: true,
	dts: true,
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
});
