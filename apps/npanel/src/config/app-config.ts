// Safe read for standalone/Docker where package.json path may differ
let version = "1.0.0";
try {
  const packageJson = await import("../../package.json").then((m) => m.default);
  version = packageJson?.version ?? version;
} catch {
  // Ignore: standalone build or missing package.json
}

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Nisc Cloud - nPanel",
  version,
  copyright: `© ${currentYear}, Nisc Cloud.`,
  meta: {
    title: "Nisc Cloud",
    description:
      "Nisc Cloud",
  },
};
