import Image from "next/image";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const siteConfig = {
  name: "Nisc Cloud",
  docsTitle: "Nisc Cloud",
  description:
    "Documentation for Nisc Cloud services: WordPress hosting, domains, VPS, email, SSL, and nPanel.",
  url: "https://nisccloud.com",
  panelUrl: "https://npanel.nisccloud.com",
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <Image
          src="/nisc-logo.png"
          alt="Nisc Cloud"
          width={160}
          height={42}
          className="h-8 w-auto"
          priority
        />
      ),
      url: "/",
    },
    links: [
      {
        text: "Documentation",
        url: "/docs",
        active: "nested-url",
      },
      {
        text: "nPanel",
        url: siteConfig.panelUrl,
        external: true,
      },
      {
        text: "Website",
        url: siteConfig.url,
        external: true,
      },
    ],
  };
}
