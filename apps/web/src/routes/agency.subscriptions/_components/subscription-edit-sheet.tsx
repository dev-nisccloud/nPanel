"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, Edit, Package } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

function addBillingPeriod(
	date: Date,
	cycle: "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM",
): Date {
	const next = new Date(date);
	if (cycle === "MONTHLY") next.setMonth(next.getMonth() + 1);
	else if (cycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
	else if (cycle === "BIENNIALLY") next.setFullYear(next.getFullYear() + 2);
	else next.setFullYear(next.getFullYear() + 1);
	return next;
}

function parseDate(v: string | Date | null | undefined): Date | undefined {
	if (!v) return undefined;
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

function serviceName(productName: string, productPlanName: string | null): string {
	if (!productPlanName?.trim()) return productName;
	return `${productName} - ${productPlanName}`;
}

const editFormSchema = z.object({
	name: z.string().optional(),
	ownerId: z.string().min(1, "Select an organization"),
	status: z.enum([
		"ACTIVE",
		"PENDING",
		"SUSPENDED",
		"CANCELLED",
		"EXPIRED",
		"PROCESSING",
		"FAILED",
		"UPGRADED",
		"DOWNGRADED",
	]),
	subscriptionDate: z.date().optional(),
	expiryDate: z.date().optional(),
	nextRenewalDate: z.date().optional(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
	autoRenew: z.boolean(),
	agreedPrice: z.string().optional(),
	agreedCurrency: z.string().optional(),
	productPlanId: z.string().optional(),
	primaryDomain: z.string().optional(),
	hostingType: z
		.enum([
			"WEB_HOSTING",
			"EMAIL_HOSTING",
			"RESELLER_HOSTING",
			"VPS_HOSTING",
			"DEDICATED_HOSTING",
		])
		.optional(),
	notes: z.string().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;

interface SubscriptionEditSheetProps {
	subscriptionId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SubscriptionEditSheet({
	subscriptionId,
	open,
	onOpenChange,
}: SubscriptionEditSheetProps) {
	const utils = trpc.useUtils();
	const { data: sub, isLoading } = trpc.clientSubscriptions.getById.useQuery(
		{ id: subscriptionId! },
		{ enabled: open && !!subscriptionId },
	);

	const { data: product, isLoading: isLoadingProduct } = trpc.products.getById.useQuery(
		{ id: sub?.productId ?? "", includePlans: true },
		{ enabled: open && !!sub?.productId },
	);

	const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(undefined, {
		enabled: open,
	});

	const form = useForm<EditFormData>({
		resolver: zodResolver(editFormSchema),
		defaultValues: {
			ownerId: "",
			status: "ACTIVE",
			autoRenew: false,
			agreedCurrency: "KES",
		},
	});

	React.useEffect(() => {
		if (!sub || !open) return;

		form.reset({
			name: sub.name ?? "",
			ownerId: sub.teamId ?? "",
			status: sub.status as EditFormData["status"],
			subscriptionDate: parseDate(sub.subscriptionDate),
			expiryDate: parseDate(sub.expiryDate),
			nextRenewalDate: parseDate(sub.nextRenewalDate),
			billingCycle: (sub.billingCycle as EditFormData["billingCycle"]) ?? undefined,
			autoRenew: sub.autoRenew,
			agreedPrice: sub.agreedPrice ?? "",
			agreedCurrency: sub.agreedCurrency ?? "KES",
			productPlanId: sub.productPlanId ?? undefined,
			primaryDomain: sub.primaryDomain ?? "",
			hostingType: (sub.hostingType as EditFormData["hostingType"]) ?? undefined,
			notes: sub.notes ?? "",
		});
	}, [sub, open, form]);

	const updateSubscription = trpc.clientSubscriptions.update.useMutation({
		onSuccess: (_data, variables) => {
			captureEvent("subscription_edited");
			if (variables.status) {
				captureEvent("subscription_status_changed", { status: variables.status });
			}
			utils.clientSubscriptions.getById.invalidate({ id: subscriptionId! });
			utils.clientSubscriptions.listForAgency.invalidate();
			toast.success("Subscription updated");
			onOpenChange(false);
		},
		onError: (e) => toast.error(e.message),
	});

	const teamItems: ComboboxItem[] = React.useMemo(
		() => teams.map((t) => ({ id: t.id, label: t.name })),
		[teams],
	);

	const planItems: ComboboxItem[] = React.useMemo(() => {
		const plans = (product as { plans?: { id: string; name: string }[] } | undefined)?.plans ?? [];
		return plans.map((p) => ({ id: p.id, label: p.name }));
	}, [product]);

	const selectedOwnerId = form.watch("ownerId");
	const selectedOwner = teamItems.find((item) => item.id === selectedOwnerId);
	const selectedPlanId = form.watch("productPlanId");
	const selectedPlan = planItems.find((p) => p.id === selectedPlanId);

	const onSubmit = (data: EditFormData) => {
		if (!subscriptionId || !sub) return;

		const payload: Parameters<typeof updateSubscription.mutate>[0] = {
			id: subscriptionId,
		};

		const trimmedName = data.name?.trim() ?? "";
		const originalName = sub.name ?? "";
		if (trimmedName !== originalName) {
			payload.name = trimmedName || null;
		}

		const newTeamId = data.ownerId;
		if (newTeamId !== (sub.teamId ?? null) || sub.userId != null) {
			payload.teamId = newTeamId;
			payload.userId = null;
		}

		if (data.status !== sub.status) payload.status = data.status;

		const origSubDate = parseDate(sub.subscriptionDate)?.getTime() ?? null;
		const newSubDate = data.subscriptionDate?.getTime() ?? null;
		if (origSubDate !== newSubDate) {
			payload.subscriptionDate = data.subscriptionDate ?? null;
		}

		const origExpiry = parseDate(sub.expiryDate)?.getTime() ?? null;
		const newExpiry = data.expiryDate?.getTime() ?? null;
		if (origExpiry !== newExpiry) {
			payload.expiryDate = data.expiryDate ?? null;
		}

		const origRenewal = parseDate(sub.nextRenewalDate)?.getTime() ?? null;
		const newRenewal = data.nextRenewalDate?.getTime() ?? null;
		if (origRenewal !== newRenewal) {
			payload.nextRenewalDate = data.nextRenewalDate ?? null;
		}

		if (data.billingCycle !== undefined && data.billingCycle !== sub.billingCycle) {
			payload.billingCycle = data.billingCycle;
		}

		if (data.autoRenew !== sub.autoRenew) payload.autoRenew = data.autoRenew;

		const newPrice = data.agreedPrice?.trim() ?? "";
		const origPrice = sub.agreedPrice ?? "";
		if (newPrice !== origPrice) payload.agreedPrice = newPrice || null;

		const newCurrency = data.agreedCurrency?.trim() || "KES";
		const origCurrency = sub.agreedCurrency ?? "KES";
		if (newCurrency !== origCurrency) payload.agreedCurrency = newCurrency;

		const newPlanId = data.productPlanId || null;
		const origPlanId = sub.productPlanId ?? null;
		if (newPlanId !== origPlanId) payload.productPlanId = newPlanId;

		const newDomain = data.primaryDomain?.trim() ?? "";
		const origDomain = sub.primaryDomain ?? "";
		if (newDomain !== origDomain) payload.primaryDomain = newDomain || null;

		if (data.hostingType !== undefined && data.hostingType !== sub.hostingType) {
			payload.hostingType = data.hostingType ?? null;
		}

		const newNotes = data.notes?.trim() ?? "";
		const origNotes = sub.notes ?? "";
		if (newNotes !== origNotes) payload.notes = newNotes || null;

		if (Object.keys(payload).length === 1) {
			toast.error("No changes detected. Please modify at least one field.");
			return;
		}

		updateSubscription.mutate(payload);
	};

	const productName = sub?.product?.name ?? "";
	const productPlanName = sub?.productPlan?.name ?? null;
	const isLoadingOwnerOptions = isLoadingTeams;
	const isCommission = sub?.pricingModel === "COMMISSION";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Package className="h-6 w-6 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate">
								{subscriptionId && isLoading ? (
									<Skeleton className="h-6 w-48" />
								) : (
									`Edit ${serviceName(productName, productPlanName) || "Subscription"}`
								)}
							</SheetTitle>
							<SheetDescription>
								Update subscription details. Only changed fields will be saved.
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{isLoading ? (
					<div className="flex-1 space-y-4 px-6 py-4">
						<Skeleton className="h-20 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				) : sub ? (
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col flex-1 min-h-0"
						>
							<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
								<div className="space-y-6 pb-6">
									<section className="space-y-3">
										<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
										<div className="rounded-lg border bg-card p-4 space-y-4">
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Subscription name</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. example.com"
																{...field}
																disabled={updateSubscription.isPending}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
															disabled={updateSubscription.isPending}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="ACTIVE">Active</SelectItem>
																<SelectItem value="PENDING">Pending</SelectItem>
																<SelectItem value="SUSPENDED">Suspended</SelectItem>
																<SelectItem value="CANCELLED">Cancelled</SelectItem>
																<SelectItem value="EXPIRED">Expired</SelectItem>
																<SelectItem value="PROCESSING">Processing</SelectItem>
																<SelectItem value="FAILED">Failed</SelectItem>
																<SelectItem value="UPGRADED">Upgraded</SelectItem>
																<SelectItem value="DOWNGRADED">Downgraded</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="ownerId"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="flex items-center gap-2">
															<Building2 className="h-4 w-4 text-muted-foreground" />
															Organization
														</FormLabel>
														<FormControl>
															{isLoadingOwnerOptions ? (
																<div className="flex h-10 items-center justify-center rounded-md border">
																	<Spinner size={18} />
																</div>
															) : (
																<ComboboxDropdown
																	items={teamItems}
																	selectedItem={selectedOwner}
																	onSelect={(item) => field.onChange(item.id)}
																	placeholder="Select an organization..."
																	searchPlaceholder="Search organizations..."
																	emptyResults="No organizations found"
																	disabled={updateSubscription.isPending}
																/>
															)}
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</section>

									<section className="space-y-3">
										<h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
										<div className="rounded-lg border bg-card p-4 space-y-4">
											<FormField
												control={form.control}
												name="subscriptionDate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Subscription date</FormLabel>
														<FormControl>
															<DatePicker
																value={field.value}
																onChange={(date) => {
																	field.onChange(date);
																	const cycle = form.getValues("billingCycle");
																	if (date && cycle) {
																		form.setValue(
																			"expiryDate",
																			addBillingPeriod(date, cycle),
																		);
																	}
																}}
																placeholder="Pick a date"
																disabled={updateSubscription.isPending}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="nextRenewalDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Next renewal</FormLabel>
															<FormControl>
																<DatePicker
																	value={field.value}
																	onChange={field.onChange}
																	placeholder="Pick a date"
																	disabled={updateSubscription.isPending}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="expiryDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Expiry date</FormLabel>
															<FormControl>
																<DatePicker
																	value={field.value}
																	onChange={field.onChange}
																	placeholder="Pick a date"
																	disabled={updateSubscription.isPending}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>
									</section>

									<section className="space-y-3">
										<h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
										<div className="rounded-lg border bg-card p-4 space-y-4">
											{!isCommission && (
												<>
													<FormField
														control={form.control}
														name="billingCycle"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Billing cycle</FormLabel>
																<Select
																	onValueChange={(value) => {
																		field.onChange(value);
																		const renewal = form.getValues("nextRenewalDate");
																		if (renewal) {
																			form.setValue(
																				"expiryDate",
																				addBillingPeriod(
																					renewal,
																					value as EditFormData["billingCycle"] & string,
																				),
																			);
																		}
																	}}
																	value={field.value}
																	disabled={updateSubscription.isPending}
																>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select cycle" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		<SelectItem value="MONTHLY">Monthly</SelectItem>
																		<SelectItem value="YEARLY">Yearly</SelectItem>
																		<SelectItem value="BIENNIALLY">Biennially</SelectItem>
																		<SelectItem value="CUSTOM">Custom</SelectItem>
																	</SelectContent>
																</Select>
																<FormMessage />
															</FormItem>
														)}
													/>

													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name="agreedPrice"
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Agreed price</FormLabel>
																	<FormControl>
																		<Input
																			type="text"
																			inputMode="decimal"
																			placeholder="0.00"
																			{...field}
																			disabled={updateSubscription.isPending}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={form.control}
															name="agreedCurrency"
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Currency</FormLabel>
																	<FormControl>
																		<Input
																			placeholder="KES"
																			{...field}
																			disabled={updateSubscription.isPending}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
												</>
											)}

											<FormField
												control={form.control}
												name="autoRenew"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
																disabled={updateSubscription.isPending}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel>Auto renew</FormLabel>
															<FormDescription>
																Automatically renew this subscription when it expires
															</FormDescription>
														</div>
													</FormItem>
												)}
											/>
										</div>
									</section>

									<section className="space-y-3">
										<h3 className="text-sm font-medium text-muted-foreground">Service details</h3>
										<div className="rounded-lg border bg-card p-4 space-y-4">
											{planItems.length > 0 && (
												<FormField
													control={form.control}
													name="productPlanId"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Product plan</FormLabel>
															<FormControl>
																{isLoadingProduct ? (
																	<div className="flex h-10 items-center justify-center rounded-md border">
																		<Spinner size={18} />
																	</div>
																) : (
																	<ComboboxDropdown
																		items={planItems}
																		selectedItem={selectedPlan}
																		onSelect={(item) => field.onChange(item.id)}
																		placeholder="Select a plan..."
																		searchPlaceholder="Search plans..."
																		emptyResults="No plans found"
																		disabled={updateSubscription.isPending}
																	/>
																)}
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}

											<FormField
												control={form.control}
												name="primaryDomain"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Primary domain</FormLabel>
														<FormControl>
															<Input
																placeholder="example.com"
																{...field}
																disabled={updateSubscription.isPending}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											{sub.hostingType != null && (
												<FormField
													control={form.control}
													name="hostingType"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Hosting type</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
																disabled={updateSubscription.isPending}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select hosting type" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="WEB_HOSTING">Web hosting</SelectItem>
																	<SelectItem value="EMAIL_HOSTING">Email hosting</SelectItem>
																	<SelectItem value="RESELLER_HOSTING">Reseller hosting</SelectItem>
																	<SelectItem value="VPS_HOSTING">VPS hosting</SelectItem>
																	<SelectItem value="DEDICATED_HOSTING">Dedicated hosting</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}

											<FormField
												control={form.control}
												name="notes"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Notes</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Additional notes..."
																className="resize-none"
																rows={3}
																{...field}
																disabled={updateSubscription.isPending}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</section>
								</div>
							</ScrollArea>

							<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={updateSubscription.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={updateSubscription.isPending}>
									{updateSubscription.isPending ? (
										<>
											<Spinner size={16} className="mr-2" />
											Saving...
										</>
									) : (
										<>
											<Edit className="mr-2 h-4 w-4" />
											Save changes
										</>
									)}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				) : (
					<div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-muted-foreground">
						Subscription not found
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
