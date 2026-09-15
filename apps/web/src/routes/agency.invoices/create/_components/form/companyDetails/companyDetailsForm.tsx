import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronsUpDown, Check, Info } from "lucide-react";
import type { TeamBillingSettings, TeamBillingSummary } from "@/routes/agency.invoices/create/api/team-billing-schemas";

const REQUIRED_FIELDS: Array<keyof TeamBillingSettings> = [
	"legalName",
	"billingEmail",
	"addressLine1",
	"city",
	"country",
];

const hasCompleteBilling = (settings: TeamBillingSettings | null | undefined) => {
	if (!settings) {
		return false;
	}
	return REQUIRED_FIELDS.every((field) => {
		const value = settings[field];
		return typeof value === "string" && value.trim().length > 0;
	});
};

export const CompanyDetailsForm = () => {
	const [teamPickerOpen, setTeamPickerOpen] = useState(false);
	const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
	const userDismissedIncompleteRef = useRef(false);
	const prevTeamIdRef = useRef<string | undefined>(undefined);
	const form = useFormContext();
	const selectedOrganizationId = form.watch("teamId") as string | undefined;

	const { data, isLoading } = trpc.teamBilling.listTeams.useQuery();

	const teams = data?.teams ?? [];
	const foundTeam = teams.find((team) => team.id === selectedOrganizationId);
	const selectedOrganization: TeamBillingSummary | undefined = foundTeam ? {
		...foundTeam,
		billingSettings: foundTeam.billingSettings ? {
			...foundTeam.billingSettings,
			billingPhone: foundTeam.billingSettings.billingPhone ?? null,
			addressLine2: foundTeam.billingSettings.addressLine2 ?? null,
			state: foundTeam.billingSettings.state ?? null,
			postalCode: foundTeam.billingSettings.postalCode ?? null,
			taxId: foundTeam.billingSettings.taxId ?? null,
			additionalNotes: foundTeam.billingSettings.additionalNotes ?? null,
		} : null,
	} : undefined;
	const billingSettings = selectedOrganization?.billingSettings ?? null;
	const billingComplete = hasCompleteBilling(billingSettings);

	const setBillToValue = useCallback(
		(field: string, value: string) => {
			const currentValue = form.getValues(field) ?? "";
			if (currentValue !== value) {
				form.setValue(field, value, {
					shouldDirty: false,
					shouldTouch: false,
				});
			}
		},
		[form],
	);

	useEffect(() => {
		const applyBillTo = (
			settings: TeamBillingSettings | null,
			teamName: string | undefined,
			complete: boolean,
		) => {
			const entries: Array<[string, string]> = [
				["email", settings?.billingEmail ?? ""],
				["companyName", settings?.legalName ?? teamName ?? ""],
				["companyAddress", settings?.addressLine1 ?? ""],
				["companyCity", settings?.city ?? ""],
				["companyState", settings?.state ?? ""],
				["companyCountry", settings?.country ?? ""],
				["companyZip", settings?.postalCode ?? ""],
				["companyTaxId", settings?.taxId ?? ""],
			];

			entries.forEach(([field, value]) => {
				setBillToValue(field, value ?? "");
			});
		};

		if (!selectedOrganization) {
			applyBillTo(null, undefined, false);
			setShowIncompleteDialog(false);
			prevTeamIdRef.current = undefined;
			userDismissedIncompleteRef.current = false;
			return;
		}

		if (!billingComplete || !billingSettings) {
			applyBillTo(null, selectedOrganization.name, false);
			// Reset "dismissed" when user selected a different team so we show the dialog again
			if (prevTeamIdRef.current !== selectedOrganizationId) {
				prevTeamIdRef.current = selectedOrganizationId;
				userDismissedIncompleteRef.current = false;
			}
			if (!userDismissedIncompleteRef.current) {
				setShowIncompleteDialog(true);
			}
			return;
		}

		applyBillTo(billingSettings, selectedOrganization.name, true);
		setShowIncompleteDialog(false);
		userDismissedIncompleteRef.current = false;
	}, [billingSettings, billingComplete, selectedOrganization, setBillToValue]);

	const displayLines = useMemo(() => {
		if (!billingSettings || !billingComplete) {
			return [];
		}
		return [
			billingSettings.legalName,
			billingSettings.addressLine1,
			billingSettings.addressLine2,
			[
				billingSettings.city,
				billingSettings.state,
				billingSettings.postalCode,
			]
				.filter(Boolean)
				.join(", "),
			billingSettings.country,
			billingSettings.billingEmail ? `Email: ${billingSettings.billingEmail}` : null,
			billingSettings.billingPhone ? `Phone: ${billingSettings.billingPhone}` : null,
			billingSettings.taxId ? `Tax ID: ${billingSettings.taxId}` : null,
		].filter(Boolean) as string[];
	}, [billingSettings, billingComplete]);

	return (
		<div className="space-y-6">
			<div>
				<p className="text-2xl font-semibold pb-3">Organization Billing (Bill To)</p>
				<p className="pb-4 text-xs font-medium text-neutral-500">
					Choose the organization to invoice. Billing details are sourced from the organization&apos;s billing settings.
				</p>
				<Popover modal open={teamPickerOpen} onOpenChange={setTeamPickerOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={teamPickerOpen}
							className="w-full justify-between"
						>
							{selectedOrganization ? selectedOrganization.name : isLoading ? "Loading organizations..." : "Select organization"}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]"
						align="start"
						side="bottom"
						sideOffset={4}
						collisionPadding={16}
					>
						<Command>
							<CommandInput placeholder="Search organizations..." />
							<CommandList className="max-h-64 overflow-y-auto">
								<CommandEmpty>No organizations found.</CommandEmpty>
								<CommandGroup>
									{teams.map((team) => (
										<CommandItem
											key={team.id}
											value={`${team.name} ${team.slug}`}
											onSelect={() => {
												form.setValue("teamId", team.id, { shouldDirty: true });
												setTeamPickerOpen(false);
											}}
										>
											<span className="flex items-center justify-between w-full">
												<div>
													<p className="font-medium">{team.name}</p>
													<p className="text-xs text-muted-foreground">{team.slug}</p>
												</div>
												{team.id === selectedOrganizationId ? (
													<Check className="h-4 w-4 opacity-100" />
												) : (
													<Check className="h-4 w-4 opacity-0" />
												)}
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>

			<div className="space-y-2">
				<div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
					<Info className="h-4 w-4" />
					Billing details
				</div>
				{!selectedOrganization ? (
					<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
						Select an organization to populate the invoice recipient.
					</div>
				) : billingComplete && displayLines.length > 0 ? (
					<div className="rounded-md border bg-muted/40 p-4 text-sm">
						<p className="font-semibold">{selectedOrganization.name}</p>
						<div className="mt-2 space-y-1 text-muted-foreground">
							{displayLines.map((line, index) => (
								<p key={index}>{line}</p>
							))}
						</div>
					</div>
				) : (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
						This organization is missing required billing details. Please update the organization&apos;s billing settings to continue.
					</div>
				)}
			</div>

			<AlertDialog
				open={showIncompleteDialog}
				onOpenChange={(open) => {
					if (!open) userDismissedIncompleteRef.current = true;
					setShowIncompleteDialog(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Billing details incomplete</AlertDialogTitle>
						<AlertDialogDescription>
							The selected organization does not have completed billing settings. Please update the billing information for this organization before issuing invoices.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							autoFocus
							onClick={() => {
								userDismissedIncompleteRef.current = true;
								setShowIncompleteDialog(false);
							}}
						>
							Okay
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

