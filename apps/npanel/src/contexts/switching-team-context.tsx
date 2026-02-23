"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type SwitchingTeamContextValue = {
  isSwitchingTeam: boolean;
  startSwitchTeam: () => void;
};

const SwitchingTeamContext = createContext<SwitchingTeamContextValue | null>(null);

export function useSwitchingTeam() {
  const ctx = useContext(SwitchingTeamContext);
  if (!ctx) {
    throw new Error("useSwitchingTeam must be used within SwitchingTeamProvider");
  }
  return ctx;
}

export function SwitchingTeamProvider({ children }: { children: ReactNode }) {
  const [isSwitchingTeam, setIsSwitchingTeam] = useState(false);
  const startSwitchTeam = useCallback(() => setIsSwitchingTeam(true), []);
  const endSwitchTeam = useCallback(() => setIsSwitchingTeam(false), []);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!isSwitchingTeam) return;
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;
    const t = setTimeout(() => endSwitchTeam(), 150);
    return () => clearTimeout(t);
  }, [pathname, isSwitchingTeam, endSwitchTeam]);

  return (
    <SwitchingTeamContext.Provider value={{ isSwitchingTeam, startSwitchTeam }}>
      {children}
    </SwitchingTeamContext.Provider>
  );
}

/**
 * Overlay shown when switching companies. Matches NavigationLoader style
 * so the user sees a full-screen “Switching company...” state and cannot interact.
 * Must be rendered inside SwitchingTeamProvider.
 */
export function SwitchingTeamOverlay() {
  const ctx = useContext(SwitchingTeamContext);
  if (!ctx?.isSwitchingTeam) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-muted-foreground">Switching company...</p>
      </div>
    </div>
  );
}
