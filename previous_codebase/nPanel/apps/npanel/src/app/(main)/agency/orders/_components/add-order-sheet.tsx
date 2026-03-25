"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ShoppingCart, XIcon, Plus, Check, ChevronsUpDown, Server, Building2, Globe, AlertCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { billingCycleSchema } from "./schema";
import { getPlanTypeDisplayName } from "@/app/(main)/agency/service-plans/_components/service-plans-utils";

// Order Item Schema
const orderItemSchema = z.object({
	niscServicePlanId: z.string().min(1, { message: "Service plan is required." }),
	billingCycle: billingCycleSchema,
	domainName: z.string().optional(), // Required for HOSTING plans, validated in form
	description: z.string().optional(),
	adminDescription: z.string().optional(),
	notes: z.string().optional(),
});

// Form Schema - supports multiple items
const FormSchema = z.object({
	teamId: z.string().min(1, { message: "Team is required." }),
	items: z.array(orderItemSchema).min(1, { message: "At least one order item is required." }),
	isTaxable: z.boolean().optional().nullable(),
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	description: z.string().optional(),
	notes: z.string().optional(),
}).refine(
	(data) => {
		// If isTaxable is true, taxPercentage must be provided
		if (data.isTaxable === true && (data.taxPercentage === null || data.taxPercentage === undefined)) {
			return false;
		}
		return true;
	},
	{
		message: "Tax percentage is required when order is taxable.",
		path: ["taxPercentage"],
	}
).refine(
	(data) => {
		// Validate HOSTING plans have domainName - we'll do this after fetching plan details
		return true;
	},
	{
		message: "Domain name is required for HOSTING plans",
	}
);

type FormData = z.infer<typeof FormSchema>;

interface AddOrderSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddOrderSheet({ open, onOpenChange, onSuccess }: AddOrderSheetProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [teamOpen, setTeamOpen] = React.useState(false);
	const [domainOpenMap, setDomainOpenMap] = React.useState<Record<number, boolean>>({});
	const [planOpenMap, setPlanOpenMap] = React.useState<Record<number, boolean>>({});
	const [showNoBillingDialog, setShowNoBillingDialog] = React.useState(false);
	const [pendingOrderData, setPendingOrderData] = React.useState<FormData | null>(null);
	const isSubmittingRef = React.useRef(false);

	// Fetch all service plans (all types)
	const { data: servicePlansData, isLoading: isLoadingPlans } = trpc.hostingPlans.getAll.useQuery(
		{ isActive: true },
		{
			enabled: open,
			staleTime: 5 * 60 * 1000, // 5 minutes
		}
	);

	// Fetch teams
	const { data: teamsData, isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(
		undefined,
		{
			enabled: open,
			staleTime: 5 * 60 * 1000, // 5 minutes
		}
	);

	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		mode: "onSubmit", // Only validate on submit, not on every change
		reValidateMode: "onChange", // Re-validate on change after first submit attempt
		defaultValues: {
			teamId: "",
			items: [
				{
					niscServicePlanId: "",
					billingCycle: "MONTHLY",
					domainName: "",
					description: "",
					adminDescription: "",
					notes: "",
				},
			],
			isTaxable: false,
			taxPercentage: null,
			description: "",
			notes: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const watchedTeamId = form.watch("teamId");
	const watchedItems = form.watch("items");

	// Fetch domains for selected team
	const { data: domainsData, isLoading: isLoadingDomains } = trpc.orders.getTeamDomains.useQuery(
		{ teamId: watchedTeamId },
		{
			enabled: open && !!watchedTeamId,
			staleTime: 5 * 60 * 1000,
		}
	);

	// Get plan details for each item
	const getPlanForItem = React.useCallback((itemIndex: number) => {
		const item = watchedItems[itemIndex];
		if (!item?.niscServicePlanId || !servicePlansData) return null;
		return servicePlansData.find((plan) => plan.id === item.niscServicePlanId);
	}, [watchedItems, servicePlansData]);

	// Get available billing cycles for an item
	const getAvailableBillingCycles = React.useCallback((itemIndex: number) => {
		const plan = getPlanForItem(itemIndex);
		if (!plan) return ["MONTHLY", "YEARLY", "BIENNIALLY"];
		
		const cycleOrder = {
			MONTHLY: 1,
			YEARLY: 12,
			BIENNIALLY: 24,
		};

		const planMonths = cycleOrder[plan.billingCycle as keyof typeof cycleOrder] || 1;
		
		return (["MONTHLY", "YEARLY", "BIENNIALLY"] as const).filter((cycle) => {
			const cycleMonths = cycleOrder[cycle] || 1;
			return cycleMonths >= planMonths;
		});
	}, [getPlanForItem]);

	// Calculate price for an item (similar to invoicing pattern - calculated on render)
	const calculateItemPrice = (itemIndex: number): number => {
		const plan = getPlanForItem(itemIndex);
		if (!plan || !plan.niscPrice) return 0;

		const item = watchedItems[itemIndex];
		if (!item) return 0;

		const planPrice = parseFloat(plan.niscPrice);
		const cycleMonths = {
			MONTHLY: 1,
			YEARLY: 12,
			BIENNIALLY: 24,
		};

		const planMonths = cycleMonths[plan.billingCycle as keyof typeof cycleMonths] || 1;
		const orderMonths = cycleMonths[item.billingCycle as keyof typeof cycleMonths] || 1;

		const multiplier = orderMonths / planMonths;
		return planPrice * multiplier; // Quantity is always 1
	};

	// Calculate total order price (recalculated on every render when items/billing cycles change)
	// Similar to invoicing pattern - no memoization, recalculates automatically
	const calculateTotalPrice = (): { subtotal: number; taxAmount: number | null; total: number } => {
		const subtotal = watchedItems.reduce((sum, _, index) => {
			return sum + calculateItemPrice(index);
		}, 0);
		
		const isTaxable = form.watch("isTaxable");
		const taxPercentage = form.watch("taxPercentage");
		
		let taxAmount: number | null = null;
		let total: number;
		
		if (isTaxable && taxPercentage !== null && taxPercentage !== undefined) {
			taxAmount = subtotal * (taxPercentage / 100);
			total = subtotal + taxAmount;
		} else {
			total = subtotal;
		}
		
		return { subtotal, taxAmount, total };
	};

	const { subtotal: orderSubtotal, taxAmount, total: totalPrice } = calculateTotalPrice();
	const watchedIsTaxable = form.watch("isTaxable");
	const watchedTaxPercentage = form.watch("taxPercentage");

	// Check billing settings for selected team
	const checkBillingSettingsQuery = trpc.orders.checkTeamBillingSettings.useQuery(
		{ teamId: form.watch("teamId") },
		{
			enabled: false, // Only check when explicitly called
		}
	);

	// Create order mutation
	const createOrderMutation = trpc.orders.createServiceOrder.useMutation({
		onSuccess: (data) => {
			// Show toasts for each order item status
			if (data.orderItemStatuses && data.orderItemStatuses.length > 0) {
				data.orderItemStatuses.forEach((item) => {
					if (item.status === "PROVISIONED") {
						toast.success(`${item.planName} provisioned successfully`, {
							description: item.domainName ? `Domain: ${item.domainName}` : undefined,
						});
					} else if (item.status === "SKIPPED") {
						toast.info(`${item.planName} will be implemented later`, {
							description: "This service will be provisioned manually.",
						});
					} else if (item.status === "FAILED") {
						toast.error(`Failed to provision ${item.planName}`, {
							description: item.provisioningError || "Provisioning failed. Please try again or contact support.",
						});
					} else if (item.status === "PROVISIONING") {
						toast.info(`Provisioning ${item.planName}...`, {
							description: "This may take a few moments.",
						});
					}
				});
			}

			// Show invoice creation status
			if (data.invoiceCreated && data.invoiceNumber) {
				toast.success("Invoice created and sent", {
					description: `The Invoice number for this order is ${data.invoiceNumber}.`,
				});
			}

			// Show main order creation success
			toast.success(data.message || "Order created successfully", {
				description: data.invoiceCreated 
					? `The Invoice number for this order is ${data.invoiceNumber}.`
					: undefined,
			});

			// Reset form and close
			form.reset();
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create order");
		},
	});

	// Reset form when dialog closes
	React.useEffect(() => {
		if (!open) {
			form.reset({
				teamId: "",
				items: [
					{
						niscServicePlanId: "",
						billingCycle: "MONTHLY",
						domainName: "",
						description: "",
						adminDescription: "",
						notes: "",
					},
				],
				isTaxable: false,
				taxPercentage: null,
				description: "",
				notes: "",
			});
			isSubmittingRef.current = false;
			setIsSubmitting(false);
			setDomainOpenMap({});
			setPlanOpenMap({});
		}
	}, [open, form]);

	const onSubmit = async (data: FormData) => {
		// Prevent duplicate submissions
		if (isSubmitting || isSubmittingRef.current || createOrderMutation.isPending) {
			console.warn("Order submission already in progress, ignoring duplicate request");
			return;
		}

		// Validate HOSTING plans have domainName
		for (let i = 0; i < data.items.length; i++) {
			const item = data.items[i];
			const plan = servicePlansData?.find((p) => p.id === item.niscServicePlanId);
			if (plan?.planType === "HOSTING" && !item.domainName) {
				form.setError(`items.${i}.domainName`, {
					type: "manual",
					message: "Domain name is required for HOSTING plans",
				});
				toast.error(`Domain name is required for HOSTING plan in item ${i + 1}`);
				return;
			}
		}

		// Check billing settings before proceeding
		try {
			const billingCheck = await checkBillingSettingsQuery.refetch();
			
			if (!billingCheck.data?.hasBillingSettings) {
				// No billing settings - show dialog
				setPendingOrderData(data);
				setShowNoBillingDialog(true);
				return;
			}

			// Has billing settings - proceed with order creation (will auto-create invoice)
			await proceedWithOrderCreation(data, true);
		} catch (error) {
			toast.error("Failed to check billing settings");
			console.error("Billing settings check error:", error);
		}
	};

	const proceedWithOrderCreation = async (data: FormData, createInvoice: boolean) => {
		isSubmittingRef.current = true;
		setIsSubmitting(true);
		
		try {
			await createOrderMutation.mutateAsync({
				teamId: data.teamId,
				items: data.items.map((item) => ({
					niscServicePlanId: item.niscServicePlanId,
					billingCycle: item.billingCycle,
					domainName: item.domainName || undefined,
					description: item.description || undefined,
					adminDescription: item.adminDescription || undefined,
					notes: item.notes || undefined,
				})),
				isTaxable: data.isTaxable || undefined,
				taxPercentage: data.taxPercentage || undefined,
				description: data.description || undefined,
				notes: data.notes || undefined,
				createInvoice, // Pass flag to API
			});
		} catch (error) {
			// Error handled in mutation
		} finally {
			isSubmittingRef.current = false;
			setIsSubmitting(false);
		}
	};

	const isLoading = isLoadingPlans || isLoadingTeams;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-y-auto max-w-4xl">
				<SheetHeader className="mb-6 flex justify-between items-center flex-row">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 bg-primary/10 rounded-full">
							<ShoppingCart className="h-6 w-6 text-primary" />
						</div>
						<div>
							<SheetTitle className="text-2xl font-bold">Create Service Order</SheetTitle>
							<SheetDescription className="text-base">
								Create a new order with one or more service plans
							</SheetDescription>
						</div>
					</div>
					<SheetClose asChild>
						<Button
							size="icon"
							variant="ghost"
							className="p-0 m-0 size-auto hover:bg-transparent"
						>
							<XIcon className="size-5" />
						</Button>
					</SheetClose>
				</SheetHeader>

				<div className="px-1 pb-1">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Team Selection */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<Building2 className="h-5 w-5" />
										Team
									</CardTitle>
									<CardDescription>Select the team that will own this order</CardDescription>
								</CardHeader>
								<CardContent>
									<FormField
										control={form.control}
										name="teamId"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>Team *</FormLabel>
												<Popover open={teamOpen} onOpenChange={setTeamOpen}>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																role="combobox"
																aria-expanded={teamOpen}
																className="w-full justify-between"
																disabled={isLoadingTeams}
															>
																{isLoadingTeams ? (
																	<div className="flex items-center gap-2">
																		<Spinner className="h-4 w-4" />
																		<span>Loading teams...</span>
																	</div>
																) : field.value ? (
																	teamsData?.find((team) => team.id === field.value)?.name || "Select team"
																) : (
																	"Select team"
																)}
																<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-full p-0" style={{ pointerEvents: 'auto' }}>
														<Command>
															<CommandInput placeholder="Search teams..." />
															<CommandList className="max-h-64 overflow-auto">
																<CommandEmpty>No teams found.</CommandEmpty>
																<CommandGroup>
																	{teamsData?.map((team) => (
																		<CommandItem
																			key={team.id}
																			value={team.name}
																			onSelect={() => {
																				form.setValue("teamId", team.id);
																				setTeamOpen(false);
																			}}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					field.value === team.id ? "opacity-100" : "opacity-0"
																				)}
																			/>
																			<div className="flex flex-col flex-1">
																				<span className="font-medium">{team.name}</span>
																				<span className="text-xs text-muted-foreground">
																					{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
																				</span>
																			</div>
																		</CommandItem>
																	))}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Order Items */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2">
										<Server className="h-5 w-5" />
										Order Items
									</CardTitle>
									<CardDescription>Add one or more service plans to this order</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{fields.map((field, index) => {
										const plan = getPlanForItem(index);
										const isHosting = plan?.planType === "HOSTING";
										const availableCycles = getAvailableBillingCycles(index);
										const itemPrice = calculateItemPrice(index);

										return (
											<div key={field.id} className="p-4 border rounded-lg space-y-4">
												<div className="flex items-center justify-between mb-4">
													<h4 className="font-medium">Item {index + 1}</h4>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => {
															if (fields.length > 1) {
																remove(index);
															} else {
																// If it's the last item, clear it instead of removing (form requires at least one item)
																form.setValue(`items.${index}.niscServicePlanId`, "");
																form.setValue(`items.${index}.billingCycle`, "MONTHLY");
																form.setValue(`items.${index}.domainName`, "");
																form.setValue(`items.${index}.description`, "");
																form.setValue(`items.${index}.adminDescription`, "");
																form.setValue(`items.${index}.notes`, "");
																toast.info("Item cleared. At least one item is required in the order.");
															}
														}}
														title={fields.length === 1 ? "Clear this item (at least one item is required)" : "Remove this item"}
														className="text-destructive hover:text-destructive hover:bg-destructive/10"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>

												{/* Service Plan Selection */}
												<FormField
													control={form.control}
													name={`items.${index}.niscServicePlanId`}
													render={({ field }) => (
														<FormItem className="flex flex-col">
															<FormLabel>Service Plan *</FormLabel>
															<Popover 
																open={planOpenMap[index] || false} 
																onOpenChange={(open) => setPlanOpenMap({ ...planOpenMap, [index]: open })}
															>
																<PopoverTrigger asChild>
																	<FormControl>
																		<Button
																			variant="outline"
																			role="combobox"
																			aria-expanded={planOpenMap[index] || false}
																			className="w-full justify-between"
																			disabled={isLoadingPlans}
																		>
																			{isLoadingPlans ? (
																				<div className="flex items-center gap-2">
																					<Spinner className="h-4 w-4" />
																					<span>Loading plans...</span>
																				</div>
																			) : field.value ? (
																				<div className="flex items-center gap-2">
																					<span>{servicePlansData?.find((p) => p.id === field.value)?.name || "Select plan"}</span>
																					{plan && (
																						<Badge variant="outline" className="text-xs">
																							{getPlanTypeDisplayName(plan.planType)}
																						</Badge>
																					)}
																				</div>
																			) : (
																				"Select service plan"
																			)}
																			<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																		</Button>
																	</FormControl>
																</PopoverTrigger>
																<PopoverContent className="w-full p-0" style={{ pointerEvents: 'auto' }}>
																	<Command>
																		<CommandInput placeholder="Search plans..." />
																		<CommandList className="max-h-64 overflow-auto">
																			<CommandEmpty>No plans found.</CommandEmpty>
																			<CommandGroup>
																				{servicePlansData?.map((plan) => {
																					// Check if this plan is already added to the order
																					const isAlreadyAdded = watchedItems.some(
																						(item, idx) => 
																							idx !== index && 
																							item.niscServicePlanId === plan.id
																					);
																					
																					// Check if this plan is selected for THIS specific item
																					const isSelectedForThisItem = field.value === plan.id;
																					
																					return (
																						<CommandItem
																							key={plan.id}
																							value={plan.name}
																							onSelect={() => {
																								if (!isAlreadyAdded) {
																									form.setValue(`items.${index}.niscServicePlanId`, plan.id);
																									form.setValue(`items.${index}.billingCycle`, plan.billingCycle);
																									if (plan.planType !== "HOSTING") {
																										form.setValue(`items.${index}.domainName`, "");
																									}
																									setPlanOpenMap({ ...planOpenMap, [index]: false });
																								}
																							}}
																							disabled={isAlreadyAdded}
																							className={cn(
																								isAlreadyAdded && "opacity-50 cursor-not-allowed",
																								// Only show selected background if this plan is selected for THIS specific item
																								isSelectedForThisItem && "bg-accent text-accent-foreground",
																								// Override cmdk's data-selected for keyboard navigation - only apply if actually selected
																								!isSelectedForThisItem && "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
																							)}
																							title={isAlreadyAdded ? "This service plan has already been added to your order items" : undefined}
																						>
																						<Check
																							className={cn(
																								"mr-2 h-4 w-4",
																								field.value === plan.id ? "opacity-100" : "opacity-0"
																							)}
																						/>
																						<div className="flex flex-col flex-1">
																							<div className="flex items-center gap-2">
																								<span className="font-medium">{plan.name}</span>
																								<Badge variant="outline" className="text-xs">
																									{getPlanTypeDisplayName(plan.planType)}
																								</Badge>
																							</div>
																							{plan.description && (
																								<span className="text-sm text-muted-foreground">{plan.description}</span>
																							)}
																							<div className="flex items-center gap-2 mt-1">
																								{plan.niscPrice && (
																									<span className="text-sm font-medium">
																										{plan.niscCurrency || "KES"} {plan.niscPrice}
																									</span>
																								)}
																								<span className="text-xs text-muted-foreground">
																									/{plan.billingCycle}
																								</span>
																							</div>
																						</div>
																						{isAlreadyAdded && (
																							<div className="ml-auto">
																								<Badge variant="outline" className="text-xs">
																									Already added
																								</Badge>
																							</div>
																						)}
																					</CommandItem>
																					);
																				})}
																			</CommandGroup>
																		</CommandList>
																	</Command>
																</PopoverContent>
															</Popover>
															{plan && (
																<div className="mt-2 p-3 bg-muted rounded-lg">
																	<div className="text-sm space-y-1">
																		<p className="font-medium">{plan.name}</p>
																		{plan.description && (
																			<p className="text-muted-foreground">{plan.description}</p>
																		)}
																		{isHosting && !plan.pleskServicePlanId && (
																			<Alert className="mt-2">
																				<AlertCircle className="h-4 w-4" />
																				<AlertDescription className="text-xs">
																					This HOSTING plan does not have a Plesk service plan ID configured. Provisioning will be skipped.
																				</AlertDescription>
																			</Alert>
																		)}
																		{!isHosting && (
																			<Alert className="mt-2">
																				<AlertCircle className="h-4 w-4" />
																				<AlertDescription className="text-xs">
																					This service will be provisioned manually after order creation.
																				</AlertDescription>
																			</Alert>
																		)}
																	</div>
																</div>
															)}
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* Domain Selection - Only for HOSTING plans */}
												{isHosting && watchedTeamId && (
													<FormField
														control={form.control}
														name={`items.${index}.domainName`}
														render={({ field }) => (
															<FormItem className="flex flex-col">
																<FormLabel>Domain Name *</FormLabel>
																{isLoadingDomains ? (
																	<div className="flex items-center gap-2 py-2">
																		<Spinner className="mr-2 h-4 w-4" />
																		<span className="text-sm text-muted-foreground">Loading domains...</span>
																	</div>
																) : domainsData && domainsData.length > 0 ? (
																	<Popover 
																		open={domainOpenMap[index] || false} 
																		onOpenChange={(open) => setDomainOpenMap({ ...domainOpenMap, [index]: open })}
																	>
																		<PopoverTrigger asChild>
																			<FormControl>
																				<Button
																					variant="outline"
																					role="combobox"
																					aria-expanded={domainOpenMap[index] || false}
																					className="w-full justify-between"
																				>
																					{field.value ? (
																						domainsData.find((domain) => domain.domainName === field.value)?.domainName || field.value
																					) : (
																						"Select or type domain"
																					)}
																					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																				</Button>
																			</FormControl>
																		</PopoverTrigger>
																		<PopoverContent className="w-full p-0 z-[100]" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} style={{ pointerEvents: 'auto' }}>
																			<Command>
																				<CommandInput
																					placeholder="Search domains or type new domain..."
																					value={field.value || ""}
																					onValueChange={(value) => {
																						form.setValue(`items.${index}.domainName`, value);
																					}}
																				/>
																				<CommandList className="max-h-64 overflow-auto">
																					<CommandEmpty>
																						<div className="py-2 text-sm text-center">
																							<p className="text-muted-foreground mb-2">No domains found</p>
																							<p className="text-xs text-muted-foreground">Type a domain name to use for provisioning</p>
																						</div>
																					</CommandEmpty>
																					<CommandGroup>
																						{domainsData.map((domain) => (
																							<CommandItem
																								key={domain.id}
																								value={domain.domainName}
																								onSelect={() => {
																									form.setValue(`items.${index}.domainName`, domain.domainName);
																									setDomainOpenMap({ ...domainOpenMap, [index]: false });
																								}}
																							>
																								<Check
																									className={cn(
																										"mr-2 h-4 w-4",
																										field.value === domain.domainName ? "opacity-100" : "opacity-0"
																									)}
																								/>
																								<span className="font-medium">{domain.domainName}</span>
																							</CommandItem>
																						))}
																					</CommandGroup>
																				</CommandList>
																			</Command>
																		</PopoverContent>
																	</Popover>
																) : (
																	<>
																		<FormControl>
																			<Input
																				placeholder="example.com"
																				{...field}
																			/>
																		</FormControl>
																		<p className="text-xs text-muted-foreground">
																			No domains found for this team. Type a domain name to use for provisioning.
																		</p>
																	</>
																)}
																<FormMessage />
															</FormItem>
														)}
													/>
												)}

												{/* Billing Cycle */}
												<FormField
													control={form.control}
													name={`items.${index}.billingCycle`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Billing Cycle *</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
																disabled={!plan}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{availableCycles.map((cycle) => (
																		<SelectItem key={cycle} value={cycle}>
																			{cycle}
																			{plan && cycle === plan.billingCycle && " (Plan default)"}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* Item Price */}
												{itemPrice > 0 && plan && (
													<div className="p-3 bg-muted rounded-lg">
														<div className="flex items-center justify-between">
															<span className="text-sm text-muted-foreground">Item Total</span>
															<span className="text-base font-semibold">
																{plan.niscCurrency || "KES"} {itemPrice.toFixed(2)}
															</span>
														</div>
														<p className="text-xs text-muted-foreground mt-1">
															{plan.niscPrice} ({watchedItems[index]?.billingCycle || "MONTHLY"})
														</p>
													</div>
												)}

												{/* Optional fields for this item */}
												<FormField
													control={form.control}
													name={`items.${index}.description`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Description</FormLabel>
															<FormControl>
																<Input placeholder="Item description" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												{isHosting && (
													<FormField
														control={form.control}
														name={`items.${index}.adminDescription`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Admin Description</FormLabel>
																<FormControl>
																	<Input placeholder="Internal notes" {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</div>
										);
									})}

									{/* Add Item Button */}
									<Button
										type="button"
										variant="outline"
										onClick={() => append({
											niscServicePlanId: "",
											billingCycle: "MONTHLY",
											domainName: "",
											description: "",
											adminDescription: "",
											notes: "",
										})}
										className="w-full"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Another Item
									</Button>
								</CardContent>
							</Card>

							{/* Tax Configuration */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Tax Configuration</CardTitle>
									<CardDescription>Configure tax settings for this order</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="isTaxable"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">Taxable Order</FormLabel>
													<FormMessage />
												</div>
												<FormControl>
													<input
														type="checkbox"
														checked={field.value ?? false}
														onChange={(e) => {
															field.onChange(e.target.checked);
															if (!e.target.checked) {
																form.setValue("taxPercentage", null);
															}
														}}
														className="h-4 w-4 rounded border-gray-300"
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									{watchedIsTaxable && (
										<FormField
											control={form.control}
											name="taxPercentage"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Tax Percentage (%)</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="0"
															max="100"
															step="0.01"
															placeholder="e.g., 16.0"
															{...field}
															value={field.value ?? ""}
															onChange={(e) => {
																const value = e.target.value === "" ? null : parseFloat(e.target.value);
																field.onChange(value);
															}}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</CardContent>
							</Card>

							{/* Order Summary */}
							{totalPrice > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Order Summary</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm text-muted-foreground">Subtotal</span>
												<span className="text-base font-medium">
													{watchedItems.length > 0 && getPlanForItem(0)?.niscCurrency || "KES"} {orderSubtotal.toFixed(2)}
												</span>
											</div>
											{taxAmount !== null && taxAmount > 0 && (
												<div className="flex items-center justify-between">
													<span className="text-sm text-muted-foreground">
														Tax ({watchedTaxPercentage}%)
													</span>
													<span className="text-base font-medium">
														{watchedItems.length > 0 && getPlanForItem(0)?.niscCurrency || "KES"} {taxAmount.toFixed(2)}
													</span>
												</div>
											)}
											<div className="border-t pt-3">
												<div className="flex items-center justify-between">
													<span className="text-base font-medium">Total Order Amount</span>
													<span className="text-xl font-bold">
														{watchedItems.length > 0 && getPlanForItem(0)?.niscCurrency || "KES"} {totalPrice.toFixed(2)}
													</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Optional Order Fields */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Additional Information</CardTitle>
									<CardDescription>Optional details for this order</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Order Description</FormLabel>
												<FormControl>
													<Input placeholder="Customer-facing description" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Notes</FormLabel>
												<FormControl>
													<Input placeholder="Additional notes" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							<SheetFooter className="gap-2 sm:gap-0 pt-6">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting || isLoading || createOrderMutation.isPending}>
									{isSubmitting ? (
										<div className="flex items-center gap-2">
											<Spinner variant="ellipsis" className="text-primary-foreground h-4 w-4" />
											<span>Creating...</span>
										</div>
									) : (
										<div className="flex items-center gap-2">
											<Plus className="h-4 w-4" />
											<span>Create Order</span>
										</div>
									)}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</div>

				{/* Dialog for missing billing settings */}
				<AlertDialog open={showNoBillingDialog} onOpenChange={setShowNoBillingDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Billing Details Required</AlertDialogTitle>
							<AlertDialogDescription>
								The selected team does not have billing details configured. 
								Without billing details, we cannot automatically generate and send invoices for this order.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel 
								disabled={isSubmitting || createOrderMutation.isPending}
								onClick={() => {
									setShowNoBillingDialog(false);
									setPendingOrderData(null);
								}}
							>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={async () => {
									setShowNoBillingDialog(false);
									if (pendingOrderData) {
										await proceedWithOrderCreation(pendingOrderData, false);
										setPendingOrderData(null);
									}
								}}
								disabled={isSubmitting || createOrderMutation.isPending}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{isSubmitting || createOrderMutation.isPending ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										Creating Order...
									</>
								) : (
									"Create Order Without Invoice"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

			</SheetContent>
		</Sheet>
	);
}
