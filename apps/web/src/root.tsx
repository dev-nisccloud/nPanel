import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import "./index.css";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { NotFoundPage } from "@/components/not-found-page";
import RootLoading from "@/components/root-loading";
import { sessionGateClientMiddleware } from "@/middleware/session-gate.client";
import { GlobalBuyNowDialogWrapper } from "@/components/global-buy-now-dialog-wrapper";
import { CartStorageSync } from "@/components/cart-storage-sync";
import { CART_RESCUE_SCRIPT } from "@npanel/cart-store";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/config/app-config";
import { SessionLifetimeGuard } from "@/components/session-lifetime-guard";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import type { ThemeMode, ThemePreset } from "@/types/preferences/theme";

const DEFAULT_THEME_MODE: ThemeMode = "light";
const DEFAULT_THEME_PRESET: ThemePreset = "twitter";

export const meta: Route.MetaFunction = () => [
  { title: APP_CONFIG.meta.title },
  { name: "description", content: APP_CONFIG.meta.description },
  { name: "application-name", content: APP_CONFIG.name },
  { name: "format-detection", content: "telephone=no" },
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-title", content: "Nisc Cloud - npanel" },
  { name: "apple-mobile-web-app-status-bar-style", content: "default" },
  { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#ffffff" },
  { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0a0a0a" },
];

/** Runs on client navigations + initial load (see `clientLoader.hydrate`). */
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [sessionGateClientMiddleware];

async function rootClientLoader() {
  return null;
}
rootClientLoader.hydrate = true;
export { rootClientLoader as clientLoader };

// Used by React Router while hydrating clientLoader-backed modules.
export const hydrateFallback = <RootLoading />;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap",
  },
  { rel: "icon", href: "/favicon/favicon.ico" },
  { rel: "apple-touch-icon", href: "/favicon/apple-touch-icon.png" },
  { rel: "manifest", href: "/favicon/site.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme-preset={DEFAULT_THEME_PRESET} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Rescue _cart URL param into sessionStorage before React/middleware runs */}
        <script dangerouslySetInnerHTML={{ __html: CART_RESCUE_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <SessionLifetimeGuard />
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME_MODE}
          disableTransitionOnChange
          enableSystem
          storageKey="vite-ui-theme"
        >
          <PreferencesStoreProvider themeMode={DEFAULT_THEME_MODE} themePreset={DEFAULT_THEME_PRESET}>
            <CartStorageSync />
            <Suspense fallback={<RootLoading />}>
              <Outlet />
            </Suspense>
            <GlobalBuyNowDialogWrapper />
            <Toaster />
          </PreferencesStoreProvider>
        </ThemeProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = "Error";
    details = error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

