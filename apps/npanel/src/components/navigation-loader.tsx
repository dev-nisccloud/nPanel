"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if pathname actually changed
    if (pathname !== previousPathnameRef.current) {
      // Show loading immediately
      setIsLoading(true);
      
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Hide loading after navigation completes
      // Using requestAnimationFrame to ensure DOM has updated
      loadingTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsLoading(false);
          previousPathnameRef.current = pathname;
        });
      }, 150);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [pathname]);

  // Listen for link clicks to show loading immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      // Check if it's an internal Next.js link
      if (link && link.href && !link.target && !link.hasAttribute("download")) {
        try {
          const url = new URL(link.href, window.location.origin);
          // Only show loader for same-origin navigation
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            setIsLoading(true);
          }
        } catch {
          // Invalid URL, ignore
        }
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener("click", handleClick, true);
    
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner variant="infinite" className="text-primary" size="md" />
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

