"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";

export const UNCATEGORIZED_ORG_ROUTE = "uncategorized";

export type OrganizationGroup = {
	routeId: string;
	teamId: string | null;
	name: string;
	count: number;
	lastAt: Date | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function groupItemsByOrganization<T>(
	items: T[],
	getTeam: (item: T) => { teamId: string | null; teamName?: string | null },
	getDate: (item: T) => Date | string | null | undefined,
): OrganizationGroup[] {
	const map = new Map<string, OrganizationGroup>();

	for (const item of items) {
		const { teamId, teamName } = getTeam(item);
		const routeId = teamId ?? UNCATEGORIZED_ORG_ROUTE;
		const date = toDate(getDate(item));
		const existing = map.get(routeId);
		if (existing) {
			existing.count += 1;
			if (date && (!existing.lastAt || date > existing.lastAt)) {
				existing.lastAt = date;
			}
			continue;
		}
		map.set(routeId, {
			routeId,
			teamId,
			name: teamId ? (teamName?.trim() || "Untitled organization") : "Uncategorized",
			count: 1,
			lastAt: date,
		});
	}

	return [...map.values()].sort((a, b) => {
		if (a.teamId == null) return 1;
		if (b.teamId == null) return -1;
		return a.name.localeCompare(b.name);
	});
}

export function OrganizationGroupsList({
	groups,
	searchQuery,
	onSearchChange,
	itemLabel,
	isLoading,
	isError,
	error,
	onRetry,
	onOpenGroup,
	toolbarActions,
}: {
	groups: OrganizationGroup[];
	searchQuery: string;
	onSearchChange: (value: string) => void;
	itemLabel: string;
	isLoading?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	onOpenGroup: (group: OrganizationGroup) => void;
	toolbarActions?: React.ReactNode;
}) {
	const filtered = React.useMemo(() => {
		if (!searchQuery.trim()) return groups;
		const q = searchQuery.toLowerCase().trim();
		return groups.filter((group) => group.name.toLowerCase().includes(q));
	}, [groups, searchQuery]);

	const items: SearchableCleanListItem[] = filtered.map((group) => ({
		key: group.routeId,
		title: group.name,
		description: !group.teamId ? (
			<Badge variant="outline" className="font-normal">
				No organization
			</Badge>
		) : undefined,
		cells: {
			count: (
				<CleanListCell className="text-sm font-medium text-foreground">
					{group.count} {itemLabel}
					{group.count === 1 ? "" : "s"}
				</CleanListCell>
			),
			last: (
				<CleanListCell>
					{group.lastAt ? group.lastAt.toLocaleDateString() : "—"}
				</CleanListCell>
			),
		},
		trailing: <ChevronRight className="size-4 text-muted-foreground" />,
		onClick: () => onOpenGroup(group),
		actions: <ViewDetailsButton onClick={() => onOpenGroup(group)} />,
	}));

	return (
		<SearchableCleanList
			items={items}
			searchQuery={searchQuery}
			onSearchChange={onSearchChange}
			totalCount={groups.length}
			isLoading={isLoading}
			isError={isError}
			error={error}
			onRetry={onRetry}
			searchPlaceholder="Search organizations..."
			errorTitle="Failed to load organizations"
			emptyMessage={
				searchQuery.trim()
					? `No organizations match "${searchQuery}"`
					: `No ${itemLabel}s found yet.`
			}
			columns={[
				{ key: "name", label: "Organization" },
				{ key: "count", label: itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1) + "s", className: "w-40", hideBelow: "@lg" },
				{ key: "last", label: "Last activity", className: "w-36", hideBelow: "@xl" },
				{ key: "actions", label: "Actions", align: "end" },
			]}
			toolbarActions={toolbarActions}
		/>
	);
}
