"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

type LinkInvoiceOrganizationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	currentTeamId?: string | null;
	onLinked?: () => void;
};

export function LinkInvoiceOrganizationDialog({
	open,
	onOpenChange,
	invoiceId,
	currentTeamId,
	onLinked,
}: LinkInvoiceOrganizationDialogProps) {
	const [pickerOpen, setPickerOpen] = React.useState(false);
	const [teamId, setTeamId] = React.useState(currentTeamId ?? "");
	const utils = trpc.useUtils();
	const { data, isLoading } = trpc.teamBilling.listTeams.useQuery(undefined, { enabled: open });
	const teams = data?.teams ?? [];
	const selected = teams.find((team) => team.id === teamId);
	const reassigning = Boolean(currentTeamId);

	React.useEffect(() => {
		if (open) setTeamId(currentTeamId ?? "");
	}, [open, currentTeamId]);

	const linkMutation = trpc.invoicing.linkToOrganization.useMutation({
		onSuccess: (result) => {
			toast.success(reassigning ? "Organization updated" : "Invoice linked", { description: result.teamName });
			utils.invoicing.list.invalidate();
			utils.invoicing.listTeamsSummary.invalidate();
			utils.invoicing.getById.invalidate({ id: invoiceId });
			onLinked?.();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(reassigning ? "Could not reassign invoice" : "Could not link invoice", { description: error.message });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{reassigning ? "Reassign to organization" : "Link to organization"}</DialogTitle>
					<DialogDescription>
						{reassigning ? "Choose a different organization." : "Choose an organization."}
					</DialogDescription>
				</DialogHeader>
				<Popover modal open={pickerOpen} onOpenChange={setPickerOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" role="combobox" aria-expanded={pickerOpen} className="w-full justify-between">
							{selected?.name ?? (isLoading ? "Loading…" : "Select organization")}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
						<Command>
							<CommandInput placeholder="Search organizations" />
							<CommandList className="max-h-64">
								<CommandEmpty>No organizations found.</CommandEmpty>
								<CommandGroup>
									{teams.map((team) => (
										<CommandItem
											key={team.id}
											value={`${team.name} ${team.slug}`}
											onSelect={() => {
												setTeamId(team.id);
												setPickerOpen(false);
											}}
										>
											<span className="flex-1">{team.name}</span>
											<Check className={team.id === teamId ? "h-4 w-4" : "h-4 w-4 opacity-0"} />
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={linkMutation.isPending}>
						Cancel
					</Button>
					<Button
						disabled={!teamId || teamId === currentTeamId || linkMutation.isPending}
						onClick={() => linkMutation.mutate({ invoiceId, teamId })}
					>
						{linkMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
						{reassigning ? "Reassign" : "Link"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
