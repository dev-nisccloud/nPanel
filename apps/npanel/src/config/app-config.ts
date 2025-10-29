import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Nisc Cloud nPanel",
  version: packageJson.version,
  copyright: `© ${currentYear}, Nisc Cloud.`,
  meta: {
    title: "Nisc Cloud",
    description:
      "Nisc Cloud",
  },
};
