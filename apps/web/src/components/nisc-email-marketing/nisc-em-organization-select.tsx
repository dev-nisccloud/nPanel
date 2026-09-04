"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { trpc } from "@/utils/trpc";

const NONE = "__none__";

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
	const { data: teams, isLoading } = trpc.niscEmailMarketing.eligibleTeams.list.useQuery(
		{},
		{ enabled: showAdminFeatures, staleTime: 5 * 60 * 1000 },
	);

	const selectValue = value && value !== "" ? value : NONE;
	const locked = disabled || !showAdminFeatures;

	return (
		<div className="grid gap-2">
			<Label>Organization{optional ? " (optional)" : ""}</Label>
			<Select
				value={selectValue}
				onValueChange={(next) => onChange(next === NONE ? "" : next)}
				disabled={locked || isLoading}
			>
				<SelectTrigger className="w-1/2">
					<SelectValue
						placeholder={isLoading ? "Loading organizations…" : "Select an organization"}
					/>
				</SelectTrigger>
				<SelectContent>
					{optional ? <SelectItem value={NONE}>None</SelectItem> : null}
					{teams?.map((team) => (
						<SelectItem key={team.id} value={team.id}>
							{team.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{!isLoading && showAdminFeatures && (teams?.length ?? 0) === 0 ? (
				<p className="text-xs text-muted-foreground">No organizations available.</p>
			) : null}
		</div>
	);
}
