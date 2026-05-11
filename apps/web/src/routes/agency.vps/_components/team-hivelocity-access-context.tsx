"use client";

import * as React from "react";

export type TeamHivelocityResourceCategory = "vps" | "vds" | "dedicated";

export type TeamHivelocityAccess = {
	teamSlug: string;
	teamResourceCategory: TeamHivelocityResourceCategory;
};

const TeamHivelocityAccessContext = React.createContext<TeamHivelocityAccess | null>(null);

export function TeamHivelocityAccessProvider({
	value,
	children,
}: {
	value: TeamHivelocityAccess | null;
	children: React.ReactNode;
}) {
	return (
		<TeamHivelocityAccessContext.Provider value={value}>{children}</TeamHivelocityAccessContext.Provider>
	);
}

export function useTeamHivelocityAccess(): TeamHivelocityAccess | null {
	return React.useContext(TeamHivelocityAccessContext);
}

/** Spread onto team-scoped Hivelocity device calls; empty object on agency routes. */
export function useHivelocityTeamTrpcInput(): Pick<TeamHivelocityAccess, "teamSlug" | "teamResourceCategory"> | Record<string, never> {
	const t = useTeamHivelocityAccess();
	if (!t) return {};
	return { teamSlug: t.teamSlug, teamResourceCategory: t.teamResourceCategory };
}
