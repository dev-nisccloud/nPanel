import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { CartStorageSync } from "../CartStorageSync.tsx";
import CookieConsent from "@/components/shadcn-space/blocks/cookie-consent-01/index.tsx";
import { SkipToMain } from "@/components/SkipToMain.tsx";
import { CurrencyProvider } from "./currency.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <TooltipProvider delayDuration={200}>
        <ThemeProvider>
          <CurrencyProvider>
            <SkipToMain />
            <CartStorageSync />
            <Toaster />
            <CookieConsent />
            {children}
          </CurrencyProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
