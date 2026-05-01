"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type InteractionMode = "select" | "pan";

interface InteractionContextType {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<InteractionMode>("select");
  const [isDirty, setIsDirty] = useState(false);

  return (
    <InteractionContext.Provider value={{ mode, setMode, isDirty, setIsDirty }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error("useInteraction must be used within an InteractionProvider");
  }
  return context;
};
