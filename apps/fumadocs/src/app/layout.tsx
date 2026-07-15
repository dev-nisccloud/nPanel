import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { DM_Sans } from "next/font/google";

import { siteConfig } from "@/lib/layout.shared";

import "./global.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.docsTitle,
    template: `%s | ${siteConfig.docsTitle}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: siteConfig.docsTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={dmSans.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
