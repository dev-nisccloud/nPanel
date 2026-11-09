"use client";

import * as React from "react";

export type SocialAdsAudience = "agency" | "customer";

type SocialAdsScopeValue = {
  audience: SocialAdsAudience;
  teamId: string | null;
  basePath: string;
};

const SocialAdsScopeContext = React.createContext<SocialAdsScopeValue>({
  audience: "agency",
  teamId: null,
  basePath: "/agency/social-media-ads",
});

export function SocialAdsScopeProvider({
  audience,
  teamId,
  basePath,
  children,
}: SocialAdsScopeValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ audience, teamId, basePath }),
    [audience, teamId, basePath],
  );
  return <SocialAdsScopeContext.Provider value={value}>{children}</SocialAdsScopeContext.Provider>;
}

export function useSocialAdsScope() {
  return React.useContext(SocialAdsScopeContext);
}
