import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

const STORAGE_KEY = "nisc-cookie-consent";

const CookieConsent = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    setShouldRender(true);
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "rejected");
    setVisible(false);
    window.setTimeout(() => setShouldRender(false), 500);
    if (accepted) toast.success("Cookies accepted.");
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-6 transition-all duration-500 lg:px-8",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className="pointer-events-auto mx-auto max-w-7xl">
        <div className="rounded-xl border border-border bg-background px-4 py-3 shadow-lg md:px-6 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 shrink-0 items-center rounded-full bg-secondary px-2.5">
                <Cookie className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                By clicking accept, you consent to our use of cookies.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* <Button
                type="button"
                variant="ghost"
                className="h-8 cursor-pointer rounded-full transition-colors"
                aria-label="Cookie settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button> */}
              <Button
                type="button"
                variant="outline"
                className="h-8 cursor-pointer rounded-full px-5 text-sm font-medium"
                onClick={() => dismiss(false)}
              >
                Reject all
              </Button>
              <Button
                type="button"
                className="h-8 cursor-pointer rounded-full px-5 text-sm font-medium transition-colors duration-200 hover:bg-primary/80"
                onClick={() => dismiss(true)}
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
