"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { createOrderFormSchema, type CreateOrderFormData } from "./schema";
import Link from "next/link";

const HOSTING_SERVICE_TYPES = ["web_hosting", "email_hosting"];
const DOMAIN_SERVICE_TYPE = "domain_registration";

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

	// @ts-expect-error - tRPC useMutation type instantiation is excessively deep with complex create input (items + metadata)
	const createMutation = trpc.niscServiceOrders.create.useMutation({
		onSuccess: () => {
			toast.success("Order created and queued for processing");
			onOpenChange(false);
			onSuccess?.();
			utils.niscServiceOrders.getAll.invalidate();
		},
		onError: (e) => toast.error(e.message || "Failed to create order"),
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
	const { data: domainSubs = [] } =
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
					<SheetTitle>Create NISC order</SheetTitle>
					<SheetDescription>
						Select user/team and add product items. Order will be processed in the background.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="flex flex-col gap-6 pt-4">
						<FormField
							control={form.control}
							name="teamId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Team (optional)</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value ?? ""}
										disabled={loadingTeams}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select team" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="">None</SelectItem>
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
								<FormItem>
									<FormLabel>User (optional)</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value ?? ""}
										disabled={loadingUsers}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select user" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="">None</SelectItem>
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
							At least one of Team or User must be selected.
						</p>

						<div>
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
									onRemove={() => remove(index)}
									control={form.control}
									canRemove={fields.length > 1}
									productId={form.watch(`items.${index}.productId`) ?? ""}
								/>
							))}
						</div>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes (optional)</FormLabel>
									<FormControl>
										<Input {...field} value={field.value ?? ""} placeholder="Notes" />
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
	onRemove,
	control,
	canRemove,
	productId,
}: {
	index: number;
	products: Array<{ id: string; name: string; serviceType: string }>;
	domainSubs: Array<{ id: string; name: string | null; primaryDomain: string | null }>;
	onRemove: () => void;
	control: any;
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
		<div className="rounded border p-3 space-y-3 mb-3">
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
					<FormItem>
						<FormLabel className="text-xs">Product</FormLabel>
						<Select
							onValueChange={(v) => {
								field.onChange(v);
								control.setValue(`items.${index}.productPlanId`, "");
							}}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger>
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
					<FormItem>
						<FormLabel className="text-xs">Plan</FormLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value}
							disabled={!productId || plans.length === 0}
						>
							<FormControl>
								<SelectTrigger>
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
						<FormItem>
							<FormLabel className="text-xs">Billing cycle</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value ?? ""}
							>
								<FormControl>
									<SelectTrigger>
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
				<FormField
					control={control}
					name={`items.${index}.domainSubscriptionId`}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs">Domain (required for hosting)</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value ?? ""}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select domain" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{domainSubs.length === 0 ? (
										<div className="p-2 text-sm text-muted-foreground">
											No domain subscriptions.{" "}
											<Link
												href="/agency/domains-portfolio"
												className="text-primary underline"
											>
												Register domain
											</Link>
										</div>
									) : (
										domainSubs.map((d) => (
											<SelectItem key={d.id} value={d.id}>
												{d.primaryDomain ?? d.name ?? d.id}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
			{isDomain && (
				<FormField
					control={control}
					name={`items.${index}.primaryDomain`}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs">Domain name</FormLabel>
							<FormControl>
								<Input
									{...field}
									value={field.value ?? ""}
									placeholder="example.com"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
		</div>
	);
}
