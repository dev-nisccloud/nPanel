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
import { TopProgressBar } from "@/components/top-progress-bar";

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
 * Loading indicator when switching companies. Uses the same top progress bar
 * as route navigation so the experience is consistent.
 * Must be rendered inside SwitchingTeamProvider.
 */
export function SwitchingTeamOverlay() {
  const ctx = useContext(SwitchingTeamContext);
  return <TopProgressBar active={ctx?.isSwitchingTeam ?? false} />;
}
