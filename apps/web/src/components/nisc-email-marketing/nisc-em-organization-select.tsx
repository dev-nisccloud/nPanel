"use client";

import * as React from "react";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { trpc } from "@/utils/trpc";

export function NiscEmOrganizationSelect({
	value,
	onChange,
	disabled,
	optional = true,
}: {
	value: string;
	onChange: (teamId: string) => void;
	disabled?: boolean;
	optional?: boolean;
}) {
	const { showAdminFeatures } = useNiscEmailMarketingRoute();
	const { data: teams, isLoading, isError } = trpc.niscEmailMarketing.eligibleTeams.list.useQuery(
		{},
		{ enabled: showAdminFeatures, staleTime: 5 * 60 * 1000 },
	);

	const items = React.useMemo((): ComboboxItem[] => {
		return (teams ?? []).map((team) => ({
			id: team.id,
			label: team.name,
			keywords: team.slug ? [team.slug] : undefined,
		}));
	}, [teams]);

	if (!showAdminFeatures) return null;

	const selectedItem = items.find((item) => item.id === value);

	return (
		<div className="grid gap-2">
			<div className="flex items-center justify-between gap-2">
				<Label>Organization{optional ? " (optional)" : ""}</Label>
				{optional && value ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						disabled={disabled}
						onClick={() => onChange("")}
					>
						Clear
					</Button>
				) : null}
			</div>
			<ComboboxDropdown
				items={items}
				selectedItem={selectedItem}
				onSelect={(item) => onChange(item.id)}
				placeholder={isLoading ? "Loading organizations…" : "Select an organization"}
				searchPlaceholder="Search organizations..."
				emptyResults="No organizations found"
				disabled={disabled || isLoading}
				inDialog
			/>
			{isError ? (
				<p className="text-xs text-destructive">Could not load organizations.</p>
			) : !isLoading && items.length === 0 ? (
				<p className="text-xs text-muted-foreground">No organizations available.</p>
			) : null}
		</div>
	);
}
