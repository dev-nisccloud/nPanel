"use client";

import * as React from "react";
import { Building2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";

const DEFAULT_ASSETS_LIST_INPUT = {
	platform: "meta_facebook" as const,
	assetType: "meta_ad_account",
	isActive: true,
};

export function LinkAdAccountOrganization({
	assetId,
	linkedTeamId,
	assetsListInput = DEFAULT_ASSETS_LIST_INPUT,
}: {
	assetId: string;
	linkedTeamId?: string | null;
	assetsListInput?: {
		platform: "meta_facebook" | "meta_instagram" | "google_ads" | "linkedin_ads";
		assetType: string;
		isActive: boolean;
	};
}) {
	const utils = trpc.useUtils();
	const [open, setOpen] = React.useState(false);
	const [teamId, setTeamId] = React.useState("");

	const linkQuery = trpc.customerOAuth.assets.organizationLink.useQuery(
		{ assetId },
		{ enabled: Boolean(assetId), staleTime: Number.POSITIVE_INFINITY, refetchOnWindowFocus: false },
	);
	const teamsQuery = trpc.teams.getAll.useQuery(undefined, { enabled: open });
	const linkOrganization = trpc.customerOAuth.assets.linkOrganization.useMutation({
		onSuccess: async (result) => {
			toast.success(`Linked to ${result.teamName}`);
			setOpen(false);
			setTeamId("");
			utils.customerOAuth.assets.list.setData(
				assetsListInput,
				(current) =>
					current?.map((account) =>
						account.id === assetId ? { ...account, teamId: result.teamId } : account,
					),
			);
			utils.customerOAuth.assets.organizationLink.setData({ assetId }, (current) =>
				current
					? { ...current, teamId: result.teamId, teamName: result.teamName }
					: current,
			);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to link organization");
		},
	});

	React.useEffect(() => {
		setOpen(false);
		setTeamId("");
	}, [assetId]);

	const alreadyLinked = Boolean(linkedTeamId || linkQuery.data?.teamId);
	const teamItems: ComboboxItem[] = React.useMemo(
		() =>
			[...(teamsQuery.data ?? [])]
				.filter((team) => team.isActive)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((team) => ({
					id: team.id,
					label: team.name,
					keywords: [team.slug],
				})),
		[teamsQuery.data],
	);
	const selectedTeam = teamItems.find((item) => item.id === teamId);
	const linkedName = linkQuery.data?.teamName;

	const button = (
		<Button
			variant="outline"
			size="sm"
			className="h-9 shrink-0 gap-2"
			disabled={alreadyLinked || !assetId}
			onClick={() => setOpen(true)}
		>
			<Link2 className="h-4 w-4" />
			{alreadyLinked ? "Linked to organization" : "Link to organization"}
		</Button>
	);

	return (
		<>
			{alreadyLinked ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="inline-flex shrink-0">{button}</span>
						</TooltipTrigger>
						<TooltipContent>
							{linkedName ? `Already linked to ${linkedName}` : "Already linked to an organization"}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				button
			)}
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (linkOrganization.isPending) return;
					setOpen(next);
					if (!next) setTeamId("");
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Link to organization</DialogTitle>
						<DialogDescription>
							Choose an existing organization for {linkQuery.data?.assetName || "this ad account"}.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<p className="flex items-center gap-2 text-xs text-muted-foreground">
							<Building2 className="h-3.5 w-3.5" />
							Organization
						</p>
						{teamsQuery.isLoading ? (
							<div className="flex h-10 items-center justify-center rounded-md border">
								<Spinner size={16} />
							</div>
						) : (
							<ComboboxDropdown
								items={teamItems}
								selectedItem={selectedTeam}
								onSelect={(item) => setTeamId(item.id)}
								placeholder="Select an organization..."
								searchPlaceholder="Search organizations..."
								emptyResults="No organizations found"
								disabled={linkOrganization.isPending}
								inDialog
							/>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)} disabled={linkOrganization.isPending}>
							Cancel
						</Button>
						<Button
							disabled={!teamId || linkOrganization.isPending}
							onClick={() => linkOrganization.mutate({ assetId, teamId })}
						>
							{linkOrganization.isPending ? "Linking..." : "Link organization"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
