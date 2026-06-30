import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { CartStorageSync } from "../CartStorageSync.tsx";
import CookieConsent from "@/components/shadcn-space/blocks/cookie-consent-01/index.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <TooltipProvider delayDuration={200}>
        <ThemeProvider>
          <CartStorageSync />
          <Toaster />
          <CookieConsent />
          {children}
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
