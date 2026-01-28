"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { PageLoadingOverlay } from "@/components/page-loading-overlay";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

const HIDE_DELAY_MS = 400;

export function NavigationLoader() {
  const pathname = usePathname();
  const { isNavigating: contextNavigating } = useNavigationLoading() ?? { isNavigating: false };
  const [localLoading, setLocalLoading] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      setLocalLoading(true);
      previousPathnameRef.current = pathname;

      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        setLocalLoading(false);
        loadingTimeoutRef.current = null;
      }, HIDE_DELAY_MS);
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link?.href && !link.target && !link.hasAttribute("download")) {
        try {
          const url = new URL(link.href, window.location.origin);
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            setLocalLoading(true);
          }
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  const showOverlay = localLoading || contextNavigating;
  if (!showOverlay) return null;

  return <PageLoadingOverlay />;
}
