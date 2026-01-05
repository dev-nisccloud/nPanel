"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface TeamContextValue {
  teamId: string;
  teamSlug: string;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamContextProvider({
  children,
  teamId,
  teamSlug,
}: {
  children: ReactNode;
  teamId: string;
  teamSlug: string;
}) {
  return (
    <TeamContext.Provider value={{ teamId, teamSlug }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext(): TeamContextValue | null {
  return useContext(TeamContext);
}

