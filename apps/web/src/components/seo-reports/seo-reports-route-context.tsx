"use client";

import * as React from "react";

export type SeoReportsRouteConfig = {
	basePath: string;
	teamId: string | null;
	teamSlug: string | null;
	isCustomer: boolean;
};

export const DEFAULT_SEO_REPORTS_ROUTE: SeoReportsRouteConfig = {
	basePath: "/agency/seo-reports",
	teamId: null,
	teamSlug: null,
	isCustomer: false,
};

const SeoReportsRouteContext = React.createContext<SeoReportsRouteConfig>(
	DEFAULT_SEO_REPORTS_ROUTE,
);

export function SeoReportsRouteProvider({
	config,
	children,
}: {
	config: SeoReportsRouteConfig;
	children: React.ReactNode;
}) {
	return (
		<SeoReportsRouteContext.Provider value={config}>
			{children}
		</SeoReportsRouteContext.Provider>
	);
}

export function useSeoReportsRoute(): SeoReportsRouteConfig {
	return React.useContext(SeoReportsRouteContext);
}
