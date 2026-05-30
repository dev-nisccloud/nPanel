"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Receipt } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

const ZEEPO_TOKEN_OVERRIDE_KEY = "zeepoTokenGrantOverride";

const SERVICE_PRODUCTS = [
	{ id: "zeepo_ai_agent", label: "Zeepo AI Agent" },
	{ id: "nisc_email_marketing", label: "Nisc Email Marketing" },
] as const;

const createFormSchema = z
	.object({
		teamId: z.string().min(1, "Select a team"),
		serviceProduct: z.enum(["zeepo_ai_agent", "nisc_email_marketing"]),
		planId: z.string().min(1, "Select a plan"),
		amount: z.string().min(1, "Enter the payment amount"),
		overrideTokens: z.boolean(),
		tokenGrant: z.string().optional(),
		transactionReference: z
			.string()
			.min(3, "Transaction reference must be at least 3 characters"),
	})
	.superRefine((data, ctx) => {
		const amount = Number.parseFloat(data.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			ctx.addIssue({ code: "custom", message: "Amount must be greater than 0", path: ["amount"] });
		}
		if (data.serviceProduct === "zeepo_ai_agent" && data.overrideTokens) {
			const tokens = Number.parseInt(data.tokenGrant ?? "", 10);
			if (!Number.isFinite(tokens) || tokens < 0) {
				ctx.addIssue({
					code: "custom",
					message: "Enter a valid token count (0 or more)",
					path: ["tokenGrant"],
				});
			}
		}
	});

type CreateFormData = z.infer<typeof createFormSchema>;

type ZeepoPlanOption = {
	id: string;
	name: string;
	zeepoPlanType: string;
	tokenGrant: number;
	displayPrice: number;
	displayCurrency: string;
	billingCycle: string | null;
};

type NiscEmPlanOption = {
	id: string;
	name: string;
	productId: string;
	productName: string;
	displayPrice: number;
	displayCurrency: string;
	billingCycle: string;
};

function normalizeBillingCycle(
	raw: string | null | undefined,
): "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" {
	const v = (raw ?? "MONTHLY").toUpperCase();
	if (v === "YEARLY" || v === "BIENNIALLY" || v === "CUSTOM") return v;
	return "MONTHLY";
}

interface CreateSubscriptionSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateSubscriptionSheet({ open, onOpenChange }: CreateSubscriptionSheetProps) {
	const utils = trpc.useUtils();

	const { data: teams = [], isLoading: loadingTeams } = trpc.teams.getAll.useQuery(undefined, {
		enabled: open,
	});

	const form = useForm<CreateFormData>({
		resolver: zodResolver(createFormSchema),
		defaultValues: {
			teamId: "",
			serviceProduct: "zeepo_ai_agent",
			planId: "",
			amount: "",
			overrideTokens: false,
			tokenGrant: "",
			transactionReference: "",
		},
	});

	const watchedTeamId = form.watch("teamId");
	const watchedPlanId = form.watch("planId");
	const watchedOverride = form.watch("overrideTokens");
	const watchedServiceProduct = form.watch("serviceProduct");

	const isZeepo = watchedServiceProduct === "zeepo_ai_agent";

	const { data: zeepoPlansData, isLoading: loadingZeepoPlans } =
		trpc.zeepoAgent.billing.listPurchasePlans.useQuery(
			{ displayCurrency: "KES" },
			{ enabled: open && isZeepo },
		);

	const { data: niscEmPlansData, isLoading: loadingNiscEmPlans } =
		trpc.products.getNiscEmailMarketingPlansForPricing.useQuery(undefined, {
			enabled: open && !isZeepo,
		});

	const zeepoPlans = React.useMemo((): ZeepoPlanOption[] => {
		return (zeepoPlansData?.data ?? [])
			.filter((p) => String(p.zeepoPlanType ?? "") !== "pay_as_you_go")
			.map((p) => ({
				id: String(p.id),
				name: String(p.name),
				zeepoPlanType: String(p.zeepoPlanType ?? "subscription"),
				tokenGrant:
					typeof p.tokenGrant === "number"
						? p.tokenGrant
						: Number.parseInt(String(p.tokenGrant ?? "0"), 10) || 0,
				displayPrice:
					typeof p.displayPrice === "number"
						? p.displayPrice
						: Number.parseFloat(String(p.displayPrice ?? "0")) || 0,
				displayCurrency: String(p.displayCurrency ?? "KES"),
				billingCycle: p.billingCycle != null ? String(p.billingCycle) : null,
			}));
	}, [zeepoPlansData?.data]);

	const niscEmPlans = React.useMemo((): NiscEmPlanOption[] => {
		return (niscEmPlansData?.plans ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			productId: p.productId,
			productName: p.productName,
			displayPrice: Number.parseFloat(p.niscPrice ?? "0") || 0,
			displayCurrency: p.niscCurrency || "KES",
			billingCycle: p.billingCycle || "MONTHLY",
		}));
	}, [niscEmPlansData?.plans]);

	const zeepoProductId = zeepoPlansData?.productId;

	const selectedZeepoPlan = React.useMemo(
		() => zeepoPlans.find((p) => p.id === watchedPlanId) ?? null,
		[zeepoPlans, watchedPlanId],
	);

	const selectedNiscEmPlan = React.useMemo(
		() => niscEmPlans.find((p) => p.id === watchedPlanId) ?? null,
		[niscEmPlans, watchedPlanId],
	);

	const selectedPlan = isZeepo ? selectedZeepoPlan : selectedNiscEmPlan;
	const loadingPlans = isZeepo ? loadingZeepoPlans : loadingNiscEmPlans;
	const planOptions = isZeepo ? zeepoPlans : niscEmPlans;
	const displayCurrency = isZeepo
		? (selectedZeepoPlan?.displayCurrency ?? "KES")
		: (selectedNiscEmPlan?.displayCurrency ?? "KES");

	const { data: teamMembers = [] } = trpc.teams.getMembers.useQuery(
		{ teamId: watchedTeamId },
		{ enabled: open && Boolean(watchedTeamId) },
	);

	const teamItems = React.useMemo((): ComboboxItem[] => {
		return teams.map((t) => ({
			id: t.id,
			label: t.name,
		}));
	}, [teams]);

	React.useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	React.useEffect(() => {
		form.setValue("planId", "");
		form.setValue("amount", "");
		form.setValue("overrideTokens", false);
		form.setValue("tokenGrant", "");
	}, [watchedServiceProduct, form]);

	React.useEffect(() => {
		if (!selectedPlan) return;
		const price = isZeepo
			? (selectedZeepoPlan?.displayPrice ?? 0)
			: (selectedNiscEmPlan?.displayPrice ?? 0);
		form.setValue("amount", String(Math.ceil(price)));
		if (isZeepo && selectedZeepoPlan && !form.getValues("overrideTokens")) {
			form.setValue("tokenGrant", String(selectedZeepoPlan.tokenGrant));
		}
	}, [selectedPlan, selectedZeepoPlan, selectedNiscEmPlan, isZeepo, form]);

	const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation();
	const createFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation();

	const [submitting, setSubmitting] = React.useState(false);

	const onSubmit = form.handleSubmit(async (data) => {
		const ownerUserId =
			teamMembers.find((m) => m.role === "OWNER")?.userId ?? teamMembers[0]?.userId;

		setSubmitting(true);
		try {
			if (data.serviceProduct === "zeepo_ai_agent") {
				if (!zeepoProductId || !selectedZeepoPlan) {
					toast.error("Zeepo AI Agent product is not available.");
					return;
				}

				const amount = Math.ceil(Number.parseFloat(data.amount));
				const metadata: Record<string, unknown> = {};
				if (data.overrideTokens && data.tokenGrant?.trim()) {
					metadata[ZEEPO_TOKEN_OVERRIDE_KEY] = Number.parseInt(data.tokenGrant, 10);
				}

				const billingCycle =
					selectedZeepoPlan.zeepoPlanType === "top_up"
						? ("CUSTOM" as const)
						: normalizeBillingCycle(selectedZeepoPlan.billingCycle);

				const payment = await recordManualPayment.mutateAsync({
					transactionReference: data.transactionReference.trim(),
					amount,
					currency: selectedZeepoPlan.displayCurrency || "KES",
					teamId: data.teamId,
					transactionDesc: `Agency subscription: Zeepo AI Agent — ${selectedZeepoPlan.name}`.slice(
						0,
						200,
					),
				});

				await createFromPayment.mutateAsync({
					checkoutRequestId: payment.checkoutRequestId,
					teamId: data.teamId,
					...(ownerUserId ? { billedForUserId: ownerUserId } : {}),
					currency: selectedZeepoPlan.displayCurrency || "KES",
					items: [
						{
							productId: zeepoProductId,
							productPlanId: data.planId,
							billingCycle,
							itemPrice: String(amount),
							itemSubtotal: String(amount),
							description: selectedZeepoPlan.name,
							...(Object.keys(metadata).length > 0 ? { metadata } : {}),
						},
					],
				});
			} else {
				if (!selectedNiscEmPlan) {
					toast.error("Nisc Email Marketing product is not available.");
					return;
				}

				const amount = Math.ceil(Number.parseFloat(data.amount));
				const billingCycle = normalizeBillingCycle(selectedNiscEmPlan.billingCycle);

				const payment = await recordManualPayment.mutateAsync({
					transactionReference: data.transactionReference.trim(),
					amount,
					currency: selectedNiscEmPlan.displayCurrency || "KES",
					teamId: data.teamId,
					transactionDesc:
						`Agency subscription: Nisc Email Marketing — ${selectedNiscEmPlan.name}`.slice(
							0,
							200,
						),
				});

				await createFromPayment.mutateAsync({
					checkoutRequestId: payment.checkoutRequestId,
					teamId: data.teamId,
					...(ownerUserId ? { billedForUserId: ownerUserId } : {}),
					currency: selectedNiscEmPlan.displayCurrency || "KES",
					items: [
						{
							productId: selectedNiscEmPlan.productId,
							productPlanId: data.planId,
							billingCycle,
							itemPrice: String(amount),
							itemSubtotal: String(amount),
							description: selectedNiscEmPlan.name,
						},
					],
				});
			}

			toast.success("Subscription order created. Invoice sent and service provisioned.");
			onOpenChange(false);
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.niscServiceOrders.getAll.invalidate();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not create subscription.";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	});

	const isBusy = submitting || recordManualPayment.isPending || createFromPayment.isPending;
	const canSubmit =
		isZeepo
			? Boolean(zeepoProductId && zeepoPlans.length > 0)
			: niscEmPlans.length > 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-xl p-0 gap-0">
				<SheetHeader className="px-6 pt-6 pb-2">
					<SheetTitle>Create subscription</SheetTitle>
					<SheetDescription>
						Create a subscription on behalf of a customer team. Payment is recorded manually,
						an invoice is emailed, and the order is provisioned through the Nisc order
						processor.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
						<ScrollArea className="flex-1 px-6">
							<div className="space-y-6 py-4 pb-6">
								<section className="space-y-4">
									<h3 className="text-sm font-medium">Customer</h3>
									<FormField
										control={form.control}
										name="teamId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Team</FormLabel>
												{loadingTeams ? (
													<Skeleton className="h-10 w-full" />
												) : (
													<ComboboxDropdown
														items={teamItems}
														selectedItem={teamItems.find((i) => i.id === field.value)}
														onSelect={(item) => field.onChange(item.id)}
														placeholder="Select team"
														searchPlaceholder="Search teams..."
														emptyResults="No teams found"
														disabled={isBusy}
													/>
												)}
												<FormDescription>
													Subscription is linked to this customer team.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium">Service</h3>
									<FormField
										control={form.control}
										name="serviceProduct"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Product</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={isBusy}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select product" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{SERVICE_PRODUCTS.map((product) => (
															<SelectItem key={product.id} value={product.id}>
																{product.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="planId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Plan</FormLabel>
												{loadingPlans ? (
													<Skeleton className="h-10 w-full" />
												) : (
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={isBusy || planOptions.length === 0}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select plan" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{isZeepo
																? zeepoPlans.map((plan) => (
																		<SelectItem key={plan.id} value={plan.id}>
																			{plan.name} — {plan.tokenGrant.toLocaleString()}{" "}
																			tokens (
																			{plan.zeepoPlanType === "top_up"
																				? "top-up"
																				: "subscription"}
																			)
																		</SelectItem>
																	))
																: niscEmPlans.map((plan) => (
																		<SelectItem key={plan.id} value={plan.id}>
																			{plan.name} — {plan.displayCurrency}{" "}
																			{Math.ceil(plan.displayPrice).toLocaleString()} /{" "}
																			{plan.billingCycle.toLowerCase()}
																		</SelectItem>
																	))}
														</SelectContent>
													</Select>
												)}
												{!isZeepo && selectedNiscEmPlan && (
													<FormDescription>
														{selectedNiscEmPlan.productName}
													</FormDescription>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>

									{isZeepo && selectedZeepoPlan && (
										<>
											<FormField
												control={form.control}
												name="overrideTokens"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={(v) => {
																	field.onChange(Boolean(v));
																	if (v && selectedZeepoPlan) {
																		form.setValue(
																			"tokenGrant",
																			String(selectedZeepoPlan.tokenGrant),
																		);
																	}
																}}
																disabled={isBusy}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel>Override token grant</FormLabel>
															<FormDescription>
																Plan includes {selectedZeepoPlan.tokenGrant.toLocaleString()}{" "}
																tokens. Override to grant a custom amount when provisioning.
															</FormDescription>
														</div>
													</FormItem>
												)}
											/>

											{watchedOverride && (
												<FormField
													control={form.control}
													name="tokenGrant"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Tokens to grant</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min={0}
																	step={1}
																	placeholder={String(selectedZeepoPlan.tokenGrant)}
																	{...field}
																	disabled={isBusy}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
										</>
									)}
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<Receipt className="h-4 w-4" />
										Payment
									</h3>
									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Amount ({displayCurrency})</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														step={1}
														{...field}
														disabled={isBusy}
													/>
												</FormControl>
												<FormDescription>
													Charged amount on the invoice and order line item.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="transactionReference"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Payment reference</FormLabel>
												<FormControl>
													<Input
														placeholder="M-Pesa receipt, bank ref, etc."
														{...field}
														disabled={isBusy}
													/>
												</FormControl>
												<FormDescription>
													Record external payment (M-Pesa, bank transfer, etc.). Invoice is
													emailed to team billing or all team owners.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</section>
							</div>
						</ScrollArea>

						<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isBusy}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isBusy || !canSubmit}>
								{isBusy ? (
									<>
										<Spinner size={16} className="mr-2" />
										Processing…
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Create subscription
									</>
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
