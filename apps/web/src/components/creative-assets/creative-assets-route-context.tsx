"use client";

import * as React from "react";

export type CreativeAssetsRouteConfig = {
	basePath: string;
	teamId: string | null;
	teamSlug: string | null;
	isCustomer: boolean;
};

export const DEFAULT_CREATIVE_ASSETS_ROUTE: CreativeAssetsRouteConfig = {
	basePath: "/agency/creative-assets",
	teamId: null,
	teamSlug: null,
	isCustomer: false,
};

const CreativeAssetsRouteContext = React.createContext<CreativeAssetsRouteConfig>(
	DEFAULT_CREATIVE_ASSETS_ROUTE,
);

export function CreativeAssetsRouteProvider({
	config,
	children,
}: {
	config: CreativeAssetsRouteConfig;
	children: React.ReactNode;
}) {
	return (
		<CreativeAssetsRouteContext.Provider value={config}>
			{children}
		</CreativeAssetsRouteContext.Provider>
	);
}

export function useCreativeAssetsRoute(): CreativeAssetsRouteConfig {
	return React.useContext(CreativeAssetsRouteContext);
}
