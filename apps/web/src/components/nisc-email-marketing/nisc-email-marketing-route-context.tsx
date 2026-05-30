"use client";

import * as React from "react";

export type NiscEmailMarketingRouteConfig = {
	basePath: string;
	emailBuilderBasePath: string;
	teamId: string | null;
	teamSlug: string | null;
	isCustomer: boolean;
	showAdminFeatures: boolean;
};

export const DEFAULT_NISC_EM_ROUTE: NiscEmailMarketingRouteConfig = {
	basePath: "/agency/nisc-email-marketing",
	emailBuilderBasePath: "/agency/nisc-email-builder",
	teamId: null,
	teamSlug: null,
	isCustomer: false,
	showAdminFeatures: true,
};

const NiscEmailMarketingRouteContext = React.createContext<NiscEmailMarketingRouteConfig>(
	DEFAULT_NISC_EM_ROUTE,
);

export function NiscEmailMarketingRouteProvider({
	config,
	children,
}: {
	config: NiscEmailMarketingRouteConfig;
	children: React.ReactNode;
}) {
	return (
		<NiscEmailMarketingRouteContext.Provider value={config}>
			{children}
		</NiscEmailMarketingRouteContext.Provider>
	);
}

export function useNiscEmailMarketingRoute(): NiscEmailMarketingRouteConfig {
	return React.useContext(NiscEmailMarketingRouteContext);
}

/** Scope list/create inputs to the active team on customer routes. */
export function niscEmTeamScopedInput<T extends { teamId?: string | null | undefined }>(
	config: NiscEmailMarketingRouteConfig,
	input: T,
): T {
	if (!config.isCustomer || !config.teamId) return input;
	return { ...input, teamId: config.teamId };
}
