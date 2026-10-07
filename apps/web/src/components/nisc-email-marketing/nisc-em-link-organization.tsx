"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NiscEmOrganizationSelect } from "@/components/nisc-email-marketing/nisc-em-organization-select";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const ALREADY_LINKED = "Already linked to an organization";

export function NiscEmLinkOrganizationDialog({
	open,
	onOpenChange,
	alreadyLinked,
	isPending,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	alreadyLinked: boolean;
	isPending?: boolean;
	onConfirm: (teamId: string) => Promise<void> | void;
	resourceLabel?: string;
}) {
	const [teamId, setTeamId] = React.useState("");

	React.useEffect(() => {
		if (!open) setTeamId("");
	}, [open]);

	const locked = alreadyLinked;
	const canSubmit = !locked && Boolean(teamId) && !isPending;

	return (
		<Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Link to organization</DialogTitle>
					<DialogDescription>
						{locked ? "This is already linked." : "Choose an organization to link this to."}
					</DialogDescription>
				</DialogHeader>
				<NiscEmOrganizationSelect
					value={teamId}
					onChange={setTeamId}
					disabled={locked || isPending}
					optional={false}
				/>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						Cancel
					</Button>
					<Button
						disabled={!canSubmit}
						onClick={async () => {
							await onConfirm(teamId);
						}}
					>
						{isPending ? (
							<span className="flex items-center gap-2">
								<Spinner size={14} className="shrink-0" />
								Linking...
							</span>
						) : (
							"Link organization"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function NiscEmLinkOrganizationMenuItem({
	alreadyLinked,
	disabled,
	onSelect,
}: {
	alreadyLinked: boolean;
	disabled?: boolean;
	onSelect: () => void;
}) {
	const { showAdminFeatures } = useNiscEmailMarketingRoute();
	if (!showAdminFeatures) return null;

	const locked = alreadyLinked || disabled;
	const item = (
		<DropdownMenuItem
			disabled={locked}
			onSelect={() => {
				if (!locked) onSelect();
			}}
		>
			<Link2 className="mr-2 h-4 w-4" />
			{alreadyLinked ? "Already linked" : "Link organization"}
		</DropdownMenuItem>
	);

	if (!alreadyLinked) return item;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="block w-full">{item}</span>
				</TooltipTrigger>
				<TooltipContent>{ALREADY_LINKED}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function NiscEmLinkOrganizationButton({
	alreadyLinked,
	disabled,
	onClick,
	className,
}: {
	alreadyLinked: boolean;
	disabled?: boolean;
	onClick: () => void;
	className?: string;
}) {
	const { showAdminFeatures } = useNiscEmailMarketingRoute();
	if (!showAdminFeatures) return null;

	const locked = alreadyLinked || disabled;
	const button = (
		<Button variant="outline" size="sm" className={className} disabled={locked} onClick={onClick}>
			<Link2 className="size-3.5 mr-1.5" />
			{alreadyLinked ? "Linked to organization" : "Link organization"}
		</Button>
	);

	if (!alreadyLinked) return button;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">{button}</span>
				</TooltipTrigger>
				<TooltipContent>{ALREADY_LINKED}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
