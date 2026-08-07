"use client";

import * as React from "react";
import {
	useForm,
	useFieldArray,
	type Control,
	type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { createOrderFormSchema, type CreateOrderFormData } from "./schema";
import { Link } from "react-router";
const HOSTING_SERVICE_TYPES = [
	"web_hosting",
	"email_hosting",
	"wordpress_hosting",
	"website_hosting",
];
const DOMAIN_SERVICE_TYPE = "domain_registration";
/** Sentinel value for "None" in Select; empty string is reserved by Radix for clearing selection. */
const NONE_VALUE = "__none__";

interface CreateOrderSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function CreateOrderSheet({
	open,
	onOpenChange,
	onSuccess,
}: CreateOrderSheetProps) {
	const utils = trpc.useUtils();
	const { data: products = [], isLoading: loadingProducts } =
		trpc.products.getAll.useQuery({ isActive: true }, { enabled: open });
	const { data: teams = [], isLoading: loadingTeams } = trpc.teams.getAll.useQuery(
		undefined,
		{ enabled: open }
	);
	const { data: users = [], isLoading: loadingUsers } =
		trpc.manageUsers.getAll.useQuery(undefined, { enabled: open });

	const createMutation = trpc.niscServiceOrders.create.useMutation({
		onSuccess: () => {
			toast.success("Order created and queued for processing");
			onOpenChange(false);
			onSuccess?.();
			utils.niscServiceOrders.getAll.invalidate();
		},
		onError: (e: { message?: string }) => toast.error(e.message || "Failed to create order"),
	});

	const form = useForm<CreateOrderFormData>({
		resolver: zodResolver(createOrderFormSchema),
		defaultValues: {
			userId: undefined,
			teamId: undefined,
			items: [{ productId: "", productPlanId: "" }],
			notes: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const watchedTeamId = form.watch("teamId");
	const watchedUserId = form.watch("userId");
	const hasOwner = !!watchedUserId || !!watchedTeamId;
	const { data: domainSubs = [], isLoading: loadingDomainSubs } =
		trpc.clientSubscriptions.getDomainSubscriptions.useQuery(
			{
				...(watchedUserId && { userId: watchedUserId }),
				...(watchedTeamId && { teamId: watchedTeamId }),
			},
			{ enabled: open && hasOwner }
		);

	const onSubmit = form.handleSubmit((values) => {
		createMutation.mutate({
			userId: values.userId || undefined,
			teamId: values.teamId || undefined,
			items: values.items.map((i) => ({
				productId: i.productId,
				productPlanId: i.productPlanId,
				billingCycle: i.billingCycle,
				primaryDomain: i.primaryDomain || undefined,
				domainSubscriptionId: i.domainSubscriptionId || undefined,
			})),
			notes: values.notes || undefined,
		});
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-xl overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Create Nisc order</SheetTitle>
					<SheetDescription>
						Select user/organization and add product items. Order will be processed in the background.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="flex flex-col gap-6 pt-4 w-full">
						<FormField
							control={form.control}
							name="teamId"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Organization (optional)</FormLabel>
									<Select
										onValueChange={(v) => field.onChange(v === NONE_VALUE ? undefined : v)}
										value={field.value ?? NONE_VALUE}
										disabled={loadingTeams}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select organization" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={NONE_VALUE}>None</SelectItem>
											{teams.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.name}
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
							name="userId"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>User (optional)</FormLabel>
									<Select
										onValueChange={(v) => field.onChange(v === NONE_VALUE ? undefined : v)}
										value={field.value ?? NONE_VALUE}
										disabled={loadingUsers}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select user" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={NONE_VALUE}>None</SelectItem>
											{users.map((u) => (
												<SelectItem key={u.id} value={u.id}>
													{u.name} ({u.email})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<p className="text-xs text-muted-foreground">
							At least one of Organization or User must be selected.
						</p>

						<div className="w-full">
							<div className="flex items-center justify-between mb-2">
								<FormLabel>Items</FormLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => append({ productId: "", productPlanId: "" })}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add item
								</Button>
							</div>
							{fields.map((field, index) => (
								<OrderItemRow
									key={field.id}
									index={index}
									products={products}
									domainSubs={domainSubs}
									loadingDomainSubs={loadingDomainSubs}
									hasOwner={hasOwner}
									onRemove={() => remove(index)}
									control={form.control}
									setValue={form.setValue}
									canRemove={fields.length > 1}
									productId={form.watch(`items.${index}.productId`) ?? ""}
								/>
							))}
						</div>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Notes (optional)</FormLabel>
									<FormControl>
										<Input className="w-full" {...field} value={field.value ?? ""} placeholder="Notes" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<SheetFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? "Creating..." : "Create order"}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

function OrderItemRow({
	index,
	products,
	domainSubs,
	loadingDomainSubs,
	hasOwner,
	onRemove,
	control,
	setValue,
	canRemove,
	productId,
}: {
	index: number;
	products: Array<{ id: string; name: string; serviceType: string }>;
	domainSubs: Array<{ id: string; name: string | null; primaryDomain: string | null }>;
	loadingDomainSubs: boolean;
	hasOwner: boolean;
	onRemove: () => void;
	control: Control<CreateOrderFormData>;
	setValue: UseFormSetValue<CreateOrderFormData>;
	canRemove: boolean;
	productId: string;
}) {
	const { data: productWithPlans } = trpc.products.getById.useQuery(
		{ id: productId, includePlans: true },
		{ enabled: !!productId }
	);
	const plans = (productWithPlans as { plans?: Array<{ id: string; name: string; billingCycle?: string; pricingModel: string }> })?.plans ?? [];
	const product = products.find((p) => p.id === productId);
	const isHosting = product && HOSTING_SERVICE_TYPES.includes(product.serviceType);
	const isDomain = product?.serviceType === DOMAIN_SERVICE_TYPE;

	return (
		<div className="rounded border p-3 space-y-3 mb-3 w-full">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Item {index + 1}</span>
				{canRemove && (
					<Button type="button" variant="ghost" size="icon" onClick={onRemove}>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
			<FormField
				control={control}
				name={`items.${index}.productId`}
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel className="text-xs">Product</FormLabel>
						<Select
							onValueChange={(v) => {
								field.onChange(v);
								setValue(`items.${index}.productPlanId`, "");
							}}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select product" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{products.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name={`items.${index}.productPlanId`}
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel className="text-xs">Plan</FormLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
							disabled={!productId || plans.length === 0}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select plan" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{plans.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			{plans.some((p) => p.pricingModel === "FIXED" && p.billingCycle) && (
				<FormField
					control={control}
					name={`items.${index}.billingCycle`}
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel className="text-xs">Billing cycle</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value ?? ""}
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
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
			{isHosting && (
				<>
					<FormField
						control={control}
						name={`items.${index}.primaryDomain`}
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="text-xs">
									Domain name (for Plesk  not a Domains subscription)
								</FormLabel>
								<FormControl>
									<Input
										className="w-full"
										placeholder="example.com"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<p className="text-[11px] text-muted-foreground">
									Used as the hosting primary domain / Plesk webspace only. Does not
									create a separate Domains subscription.
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>
					{domainSubs.length > 0 && (
						<div className="space-y-1.5">
							<FormLabel className="text-xs">Or fill from an existing domain</FormLabel>
							<div className="flex flex-wrap gap-1.5">
								{domainSubs.map((d) => {
									const label = d.primaryDomain ?? d.name ?? d.id;
									return (
										<button
											key={d.id}
											type="button"
											className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
											onClick={() => {
												setValue(`items.${index}.primaryDomain`, label);
												setValue(`items.${index}.domainSubscriptionId`, undefined);
											}}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					)}
					{!loadingDomainSubs && domainSubs.length === 0 && hasOwner && (
						<p className="text-[11px] text-muted-foreground">
							No existing Domains subscriptions for this owner  enter a FQDN above.{" "}
							<Link to="/agency/domains-portfolio" className="text-primary underline">
								Domains portfolio
							</Link>
						</p>
					)}
				</>
			)}
			{isDomain && (
				<>
					{hasOwner && (
						<div className="space-y-1.5">
							<FormLabel className="text-xs">Your domains</FormLabel>
							{loadingDomainSubs ? (
								<p className="text-xs text-muted-foreground">Loading domains…</p>
							) : domainSubs.length > 0 ? (
								<div className="flex flex-wrap gap-1.5">
									{domainSubs.map((d) => (
										<span
											key={d.id}
											className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
										>
											{d.primaryDomain ?? d.name ?? d.id}
										</span>
									))}
								</div>
							) : (
								<p className="text-xs text-muted-foreground">No domains yet.</p>
							)}
						</div>
					)}
					<FormField
						control={control}
						name={`items.${index}.primaryDomain`}
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="text-xs">Register new domain</FormLabel>
								<FormControl>
									<Input
										className="w-full"
										{...field}
										value={field.value ?? ""}
										placeholder="example.com"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			)}
		</div>
	);
}
