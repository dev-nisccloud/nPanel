import { Cookie } from "lucide-react";
import { openCookieSettings } from "@/lib/cookie-settings.ts";
import { cn } from "@/lib/utils.ts";

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#02070A] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2 dark:bg-white dark:text-[#02070A] dark:hover:bg-white/90 print:hidden",
        className,
      )}
    >
      <Cookie size={16} aria-hidden />
      Manage cookie settings
    </button>
  );
}
