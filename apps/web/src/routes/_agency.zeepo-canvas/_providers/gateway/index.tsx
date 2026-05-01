import type { ReactNode } from "react";
import { GatewayProviderClient } from "./client";

interface GatewayProviderProps {
  children: ReactNode;
}

export const GatewayProvider = ({ children }: GatewayProviderProps) => {
  return (
    <GatewayProviderClient>
      {children}
    </GatewayProviderClient>
  );
};
