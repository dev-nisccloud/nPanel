import { ReactNode, Suspense } from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/ui/sonner";
import { GlobalBuyNowDialogWrapper } from "@/components/global-buy-now-dialog-wrapper";
import { QueryProvider } from "@/providers/query-provider";
import { APP_CONFIG } from "@/config/app-config";
import { getPreference } from "@/server/server-actions";
import RootLoading from "./loading";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES, type ThemePreset, type ThemeMode } from "@/types/preferences/theme";

import "./globals.css";

const DEFAULT_THEME_MODE: ThemeMode = "light";
const DEFAULT_THEME_PRESET: ThemePreset = "twitter";

// Must be const at module scope (Next.js font loader requirement).
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

  // PWA Manifest (served by route so response is always JSON, not HTML)
  manifest: '/manifest',

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

/** Minimal HTML that redirects to login - used when root layout throws so we never 500 */
function SafeRedirectToLogin() {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0;url=/auth/login`} />
        <script dangerouslySetInnerHTML={{ __html: `window.location.replace("/auth/login");` }} />
      </head>
      <body>
        <p>Redirecting to login…</p>
      </body>
    </html>
  );
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  try {
    let pathname = "";
    try {
      pathname = (await headers()).get("x-pathname") ?? "";
    } catch {
      pathname = "/";
    }
    // Normalize: root can be "", "/", "//", or whitespace. x-pathname is set by src/proxy.ts (Next.js 16 request proxy).
    const normalized = typeof pathname === "string" ? pathname.trim().replace(/\/+/g, "/") : "";
    const isRootPath = normalized === "" || normalized === "/";

    // For GET / only: minimal shell – no getPreference, no providers, no font (max reliability).
    // Any throw below is caught so we never 500; we return 200 with redirect HTML.
    if (isRootPath) {
      return (
        <html lang="en" suppressHydrationWarning>
          <head />
          <body className="min-h-screen antialiased">
            {children}
          </body>
        </html>
      );
    }

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
                <Suspense fallback={<RootLoading />}>
                  {children}
                </Suspense>
                <GlobalBuyNowDialogWrapper />
                <Toaster />
              </PreferencesStoreProvider>
            </QueryProvider>
          </NuqsAdapter>
        </body>
      </html>
    );
  } catch (err) {
    const errDigest = (err as Error & { digest?: string })?.digest;
    if (typeof errDigest === "string" && errDigest.startsWith("VITE_REDIRECT")) {
      throw err;
    }
    // Log so Cloud Run Logging shows the real cause; then return 200 with redirect so we never 500.
    console.error(
      "[RootLayout] unexpected error:",
      err instanceof Error ? (err as Error).message : String(err),
      err instanceof Error ? (err as Error).stack : ""
    );
    return <SafeRedirectToLogin />;
  }
}
