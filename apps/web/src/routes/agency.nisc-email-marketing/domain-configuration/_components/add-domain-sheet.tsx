"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Globe, Plus, Lightbulb, ChevronRight, ChevronLeft, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const STEPS = [
	{ title: "Domain", description: "Domain name for your sending identity." },
	{ title: "DNS Records", description: "Configure DNS records to verify your domain." },
];

const FormSchema = z.object({
	domainName: z.string().min(1, "Domain name is required").regex(
		/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
		"Invalid domain name format"
	),
	teamId: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface AddDomainSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddDomainSheet({ open, onOpenChange, onSuccess }: AddDomainSheetProps) {
	const route = useNiscEmailMarketingRoute();
	const [step, setStep] = React.useState(1);
	const [showAdvanced, setShowAdvanced] = React.useState(false);
	const [createdDomain, setCreatedDomain] = React.useState<{ dnsRecords: unknown; domainName: string } | null>(null);

	const utils = trpc.useUtils();

	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			domainName: "",
			teamId: "",
		},
	});

	// Fetch teams for advanced options (agency only)
	const { data: teamsData, isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(
		undefined,
		{
			enabled: open && route.showAdminFeatures,
			staleTime: 5 * 60 * 1000,
		}
	);

	const createMutation = trpc.niscEmailMarketing.domains.create.useMutation({
		onSuccess: (data) => {
			toast.success("Domain added successfully", {
				description: `Domain ${data.domainName} has been added. Please configure DNS records.`,
			});
			utils.niscEmailMarketing.domains.listLegacy.invalidate();
			// Store created domain data and move to step 2 (DNS Records)
			setCreatedDomain({
				domainName: data.domainName,
				dnsRecords: data.dnsRecords,
			});
			setStep(2);
			// Don't call onSuccess yet - wait until user closes the sheet
		},
		onError: (e) => {
			toast.error("Failed to add domain", { description: e.message });
		},
	});

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setStep(1);
			form.reset();
			setShowAdvanced(false);
			setCreatedDomain(null);
			// Call onSuccess when sheet closes after domain creation
			if (createdDomain) {
				onSuccess?.();
			}
		}
		onOpenChange(next);
	};

	const onSubmit = async (data: FormData) => {
		try {
			const teamId = route.isCustomer
				? route.teamId ?? undefined
				: data.teamId && data.teamId !== "" && data.teamId !== "__none__"
					? data.teamId
					: undefined;

			await createMutation.mutateAsync({
				domainName: data.domainName,
				teamId,
			});
		} catch (error) {
			// Error handled in mutation
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Globe className="h-6 w-6 text-primary" />
						</div>
						<div>
							<SheetTitle>Add Domain</SheetTitle>
							<SheetDescription>
								Step {step} of 2: {STEPS[step - 1]?.title}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
					<Form {...form}>
						<form id="add-domain-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
							{/* Step 1: Domain */}
							{step === 1 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[0].title}</h3>
										<p className="text-sm text-muted-foreground">
											{STEPS[0].description}
										</p>
									</div>

									<FormField
										control={form.control}
										name="domainName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Name</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															placeholder="updates.example.com"
															{...field}
															disabled={createMutation.isPending}
															className="pr-10"
														/>
														<Lightbulb className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Advanced Options (agency only) */}
									{route.showAdminFeatures && (
									<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
										<CollapsibleTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												className="w-full justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
											>
												<ChevronRight
													className={cn(
														"mr-2 h-4 w-4 transition-transform",
														showAdvanced && "rotate-90"
													)}
												/>
												Advanced options
											</Button>
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 pt-4">
											<FormField
												control={form.control}
												name="teamId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Team (Optional)</FormLabel>
														<Select
															onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
															value={field.value && field.value !== "" ? field.value : "__none__"}
															disabled={isLoadingTeams || createMutation.isPending}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select a team (optional)" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="__none__">None</SelectItem>
																{teamsData?.map((team) => (
																	<SelectItem key={team.id} value={team.id}>
																		{team.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CollapsibleContent>
									</Collapsible>
									)}
								</div>
							)}

							{/* Step 2: DNS Records */}
							{step === 2 && createdDomain && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[1].title}</h3>
										<p className="text-sm text-muted-foreground">
											{STEPS[1].description}
										</p>
									</div>

									{createdDomain.dnsRecords && Array.isArray(createdDomain.dnsRecords) ? (
										<div className="space-y-4" key="dns-records">
											<div className="rounded-lg border bg-card p-4">
												<p className="text-sm font-medium mb-4">
													Add these DNS records to your domain <strong>{createdDomain.domainName}</strong>:
												</p>
												<div className="space-y-3">
													{(createdDomain.dnsRecords as Array<{
														name: string;
														type: string;
														value: string;
														record: string;
														status?: string;
														priority?: number;
													}>).map((record, index) => (
														<div key={index} className="rounded-md border p-3 space-y-2">
															<div className="flex items-center justify-between">
																<span className="text-sm font-medium">{record.record || record.type}</span>
																{record.status && (
																	<span className={cn(
																		"text-xs px-2 py-1 rounded",
																		record.status === "verified" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
																		record.status === "not_started" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
																		"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
																	)}>
																		{record.status}
																	</span>
																)}
															</div>
															<div className="space-y-3 text-sm">
																<div>
																	<span className="text-muted-foreground">Name</span>
																	<div className="flex items-center gap-2 mt-1">
																		<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																			{record.name}
																		</code>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 flex-shrink-0"
																			onClick={() => copyToClipboard(record.name)}
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																</div>

																<div>
																	<span className="text-muted-foreground">Type</span>
																	<div className="flex items-center gap-2 mt-1">
																		<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																			{record.type}
																		</code>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 flex-shrink-0"
																			onClick={() => copyToClipboard(record.type)}
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																</div>

																{record.priority !== undefined && (
																	<div>
																		<span className="text-muted-foreground">Priority</span>
																		<div className="flex items-center gap-2 mt-1">
																			<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																				{record.priority}
																			</code>
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-7 w-7 flex-shrink-0"
																				onClick={() => copyToClipboard(String(record.priority))}
																			>
																				<Copy className="h-3 w-3" />
																			</Button>
																		</div>
																	</div>
																)}

																<div>
																	<span className="text-muted-foreground">Value</span>
																	<div className="flex items-start gap-2 mt-1">
																		<code className="flex-1 p-2 bg-muted rounded text-xs font-mono min-w-0 break-all">
																			{record.value}
																		</code>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 flex-shrink-0"
																			onClick={() => copyToClipboard(record.value)}
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>
											<div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
												<p className="text-sm text-blue-900 dark:text-blue-100">
													<strong>Note:</strong> After adding these DNS records, it may take a few minutes for verification to complete. 
													You can check the verification status by viewing the domain details.
												</p>
											</div>
										</div>
									) : null}
								</div>
							)}
						</form>
					</Form>
				</ScrollArea>

				<SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
					<div className="flex gap-2">
						{step > 1 && (
							<Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
								<ChevronLeft className="h-4 w-4 mr-1" /> Back
							</Button>
						)}
					</div>
					<div className="flex gap-2">
						{step < 2 ? (
							<Button
								type="submit"
								form="add-domain-form"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? (
									<>
										<Spinner size={16} className="mr-2" /> Adding...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Add Domain
									</>
								)}
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								Close
							</Button>
						)}
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
