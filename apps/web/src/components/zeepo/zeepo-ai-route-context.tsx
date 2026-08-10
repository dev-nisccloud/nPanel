"use client";

import * as React from "react";

export type ZeepoAiRouteConfig = {
  /** e.g. `/agency/zeepo-ai` or `/{slug}/zeepo-ai` */
  basePath: string;
  teamId: string | null;
  teamSlug: string | null;
  isCustomer: boolean;
};

export const DEFAULT_ZEEPO_AI_ROUTE: ZeepoAiRouteConfig = {
  basePath: "/agency/zeepo-ai",
  teamId: null,
  teamSlug: null,
  isCustomer: false,
};

const ZeepoAiRouteContext = React.createContext<ZeepoAiRouteConfig>(DEFAULT_ZEEPO_AI_ROUTE);

export function ZeepoAiRouteProvider({
  config,
  children,
}: {
  config: ZeepoAiRouteConfig;
  children: React.ReactNode;
}) {
  return (
    <ZeepoAiRouteContext.Provider value={config}>{children}</ZeepoAiRouteContext.Provider>
  );
}

export function useZeepoAiRoute(): ZeepoAiRouteConfig {
  return React.useContext(ZeepoAiRouteContext);
}

export function zeepoAiSessionPath(basePath: string, sessionId: string): string {
  return `${basePath}/${sessionId}`;
}

export function zeepoAiLibraryPath(basePath: string): string {
  return `${basePath}/library`;
}

/** Session list / create input scoped to customer team when applicable. */
export function zeepoAiSessionsInput(
  config: ZeepoAiRouteConfig,
  pagination: { page: number; limit: number },
) {
  return {
    ...pagination,
    ...(config.teamId ? { teamId: config.teamId } : {}),
  };
}

export function zeepoAiCreateSessionInput(config: ZeepoAiRouteConfig) {
  return config.teamId ? { teamId: config.teamId } : {};
}

/** Match chat/library paths for a given basePath (agency or customer). */
export function isZeepoAiAppPath(pathname: string | undefined, basePath: string): boolean {
  if (!pathname) return false;
  const escaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?:/|$)`).test(pathname);
}
