"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { APP_CONFIG } from "@/config/app-config";

const REDIRECT_API = "/api/auth/redirect-target";
const RETRY_AFTER_MS = 2000;
const SHOW_RETRY_MESSAGE_AFTER_MS = 4000;

/**
 * Root path "/" - shows a loader immediately, then fetches redirect target and navigates.
 * This avoids ERR_FAILED while middleware/API are compiling; user sees "Preparing your app..." instead.
 */
export default function RootPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Loading...");
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryMessageId: ReturnType<typeof setTimeout> | null = null;

    const attempt = () => {
      fetch(REDIRECT_API, { cache: "no-store" })
        .then((res) => {
          if (cancelled) return;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: { redirect?: string }) => {
          if (cancelled || !data?.redirect) return;
          router.replace(data.redirect);
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn("[Root] redirect-target fetch failed:", err);
          setShowRetry(true);
          retryTimeoutId = setTimeout(attempt, RETRY_AFTER_MS);
        });
    };

    retryMessageId = setTimeout(() => {
      if (!cancelled) setMessage("Loading...");
    }, SHOW_RETRY_MESSAGE_AFTER_MS);

    attempt();

    return () => {
      cancelled = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (retryMessageId) clearTimeout(retryMessageId);
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <Spinner variant="infinite" className="text-primary" size={40} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">{APP_CONFIG.name}</p>
        {showRetry && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </div>
    </div>
  );
}
