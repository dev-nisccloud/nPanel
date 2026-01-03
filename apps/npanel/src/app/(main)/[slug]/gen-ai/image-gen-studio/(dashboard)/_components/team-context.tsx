"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface TeamContextValue {
  teamId: string;
  teamSlug: string;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

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

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamContext must be used within TeamContextProvider");
  }
  return context;
}


