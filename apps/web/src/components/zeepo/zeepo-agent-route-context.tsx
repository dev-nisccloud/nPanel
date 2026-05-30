"use client";

import * as React from "react";

export type ZeepoAgentRouteConfig = {
	basePath: string;
	teamId: string | null;
	teamSlug: string | null;
	isCustomer: boolean;
};

export const DEFAULT_ZEEPO_AGENT_ROUTE: ZeepoAgentRouteConfig = {
	basePath: "/agency/zeepo-ai-agent",
	teamId: null,
	teamSlug: null,
	isCustomer: false,
};

const ZeepoAgentRouteContext = React.createContext<ZeepoAgentRouteConfig>(
	DEFAULT_ZEEPO_AGENT_ROUTE,
);

export function ZeepoAgentRouteProvider({
	config,
	children,
}: {
	config: ZeepoAgentRouteConfig;
	children: React.ReactNode;
}) {
	return (
		<ZeepoAgentRouteContext.Provider value={config}>{children}</ZeepoAgentRouteContext.Provider>
	);
}

export function useZeepoAgentRoute(): ZeepoAgentRouteConfig {
	return React.useContext(ZeepoAgentRouteContext);
}

export function zeepoAgentSessionPath(basePath: string, sessionId: string): string {
	return `${basePath}/${sessionId}`;
}

/** Session list / create input scoped to customer team when applicable. */
export function zeepoAgentSessionsInput(
	config: ZeepoAgentRouteConfig,
	pagination: { page: number; limit: number },
) {
	return {
		...pagination,
		...(config.teamId ? { teamId: config.teamId } : {}),
	};
}

/** Session create payload for customer vs agency. */
export function zeepoAgentCreateSessionInput(config: ZeepoAgentRouteConfig) {
	return config.teamId ? { teamId: config.teamId } : {};
}
