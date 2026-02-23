import { ReactNode } from "react";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/ui/sonner";
import { GlobalBuyNowDialogWrapper } from "@/components/global-buy-now-dialog-wrapper";
import { QueryProvider } from "@/providers/query-provider";
import { APP_CONFIG } from "@/config/app-config";
import { getPreference } from "@/server/server-actions";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES, type ThemePreset, type ThemeMode } from "@/types/preferences/theme";

import "./globals.css";

const DEFAULT_THEME_MODE: ThemeMode = "light";
const DEFAULT_THEME_PRESET: ThemePreset = "twitter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
  applicationName: APP_CONFIG.name,

  // Favicons
  icons: {
    icon: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },

  // PWA Manifest
  manifest: '/favicon/site.webmanifest',

  // Apple-specific meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nisc Cloud - nPanel',
  },

  // Additional PWA meta
  formatDetection: {
    telephone: false,
  },
};

// Viewport configuration (Next.js 15+ requires separate export)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// Skip static prerender of "/" to avoid Next.js 15 clientReferenceManifest bug during "Generating static pages"
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let themeMode: ThemeMode = DEFAULT_THEME_MODE;
  let themePreset: ThemePreset = DEFAULT_THEME_PRESET;
  try {
    const [mode, preset] = await Promise.all([
      getPreference<ThemeMode>("theme_mode", THEME_MODE_VALUES, DEFAULT_THEME_MODE),
      getPreference<ThemePreset>("theme_preset", THEME_PRESET_VALUES, DEFAULT_THEME_PRESET),
    ]);
    themeMode = mode;
    themePreset = preset;
  } catch (err) {
    // Avoid 500 on root when cookies/headers fail (e.g. edge, first load, production proxy)
    if (process.env.NODE_ENV === "production") {
      console.warn("[RootLayout] getPreference failed, using defaults");
    } else {
      console.warn("[RootLayout] getPreference failed, using defaults:", err);
    }
  }

  return (
    <html
      lang="en"
      className={themeMode === "dark" ? "dark" : ""}
      data-theme-preset={themePreset}
      suppressHydrationWarning
    >
      <head />
      <body className={`${inter.className} min-h-screen antialiased`}>
        <NuqsAdapter>
          <QueryProvider>
            <PreferencesStoreProvider themeMode={themeMode} themePreset={themePreset}>
              {children}
              <GlobalBuyNowDialogWrapper />
              <Toaster />
            </PreferencesStoreProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
