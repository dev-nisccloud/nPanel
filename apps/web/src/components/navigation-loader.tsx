"use client";

import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router";
import { TopProgressBar } from "@/components/top-progress-bar";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

const HIDE_DELAY_MS = 400;

export function NavigationLoader() {
  const { pathname } = useLocation();
  const { isNavigating: contextNavigating } = useNavigationLoading() ?? { isNavigating: false };
  const [localLoading, setLocalLoading] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only show loading state if context says we are navigating
    setLocalLoading(false);
  }, [pathname]);

  useEffect(() => {
    // "Smart Delay" Logic:
    // We only show the full-screen overlay if standard navigation + skeleton takes longer than 300ms.
    // This prevents the overlay from blocking "instant" transitions while still providing feedback for slow loads.
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link?.href && !link.target && !link.hasAttribute("download")) {
        try {
          const url = new URL(link.href, window.location.origin);
          // Only trigger if it's an internal link to a different path
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            // Clear any existing timeout
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

            // Set timeout to show overlay ONLY after 300ms
            loadingTimeoutRef.current = setTimeout(() => {
              setLocalLoading(true);
            }, 300);
          }
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    // Cleanup: Remove listener and clear timeout
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [pathname]);

  // Clean up any stray timeouts if component unmounts
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);



  const showOverlay = localLoading || contextNavigating;
  return <TopProgressBar active={showOverlay} />;
}
