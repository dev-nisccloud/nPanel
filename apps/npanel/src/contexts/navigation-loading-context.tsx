"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

type NavigationLoadingContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
  endNavigation: () => void;
};

const NavigationLoadingContext = React.createContext<NavigationLoadingContextValue | null>(null);

const HIDE_DELAY_MS = 0; // Instant transition, no artificial delay

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathnameRef = React.useRef(pathname);

  const endNavigation = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
    prevPathnameRef.current = pathname;
  }, [pathname]);

  const startNavigation = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsNavigating(true);
  }, []);

  React.useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        timeoutRef.current = null;
      }, HIDE_DELAY_MS);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const value = React.useMemo(
    () => ({ isNavigating, startNavigation, endNavigation }),
    [isNavigating, startNavigation, endNavigation]
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const ctx = React.useContext(NavigationLoadingContext);
  return ctx;
}

/**
 * Router that shows the loading overlay before programmatic navigation.
 * Use this instead of useRouter + router.push for button-triggered navigation.
 */
export function useAppRouter() {
  const router = useRouter();
  const { startNavigation } = useNavigationLoading() ?? { startNavigation: () => { } };

  const push = React.useCallback(
    (url: string) => {
      startNavigation();
      router.push(url);
    },
    [router, startNavigation]
  );

  return { ...router, push };
}
