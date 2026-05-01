"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

interface ModelInfo {
  label: string;
  default?: boolean;
}

interface GatewayContextType {
  models: Record<string, ModelInfo>;
  imageModels: Record<string, ModelInfo>;
  videoModels: Record<string, ModelInfo>;
}

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export const useGateway = () => {
  const context = useContext(GatewayContext);

  if (!context) {
    throw new Error("useGateway must be used within a GatewayProviderClient");
  }

  return context;
};

export const GatewayProviderClient = ({ children }: { children: ReactNode }) => {
  const textModels = {
    "meta/meta-llama-3-70b-instruct": { label: "Llama 3 70B", default: true },
    "meta/meta-llama-3-8b-instruct": { label: "Llama 3 8B" },
  };

  const imageModelMap = {
    "black-forest-labs/flux-schnell": { label: "Flux Schnell", default: true },
    "black-forest-labs/flux-1.1-pro": { label: "Flux 1.1 Pro" },
  };

  const videoModelMap = {
    "minimax/video-01": { label: "Minimax Video", default: true },
    "luma/ray": { label: "Luma Ray" },
  };

  return (
    <GatewayContext.Provider
      value={{
        models: textModels,
        imageModels: imageModelMap,
        videoModels: videoModelMap,
      }}
    >
      {children}
    </GatewayContext.Provider>
  );
};
