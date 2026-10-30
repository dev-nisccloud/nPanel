"use client";

import * as React from "react";
import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import CurrencyInput from "@/routes/agency.invoices/create/_components/ui/currencyInput";
import { currencyList } from "@/lib/currency";
import { Input } from "@/routes/agency.invoices/create/_components/ui/input";
import { Plus, Trash2, Package } from "lucide-react";
import CustomNumberInput from "@/routes/agency.invoices/create/_components/ui/customNumberInput";
import { useGetValue } from "@/routes/agency.quotations/create/hooks/useGetValue";
import { Controller, useFormContext } from "react-hook-form";
import type { Item } from "@/routes/agency.quotations/create/types";
import { trpc } from "@/utils/trpc";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

export const QuotationDetailsForm = () => {
	const { control } = useFormContext();
	const currency = useGetValue("currency", "KES");
	const currencyDetails = currencyList.find(
		(c) => c.value.toLowerCase() === currency.toLowerCase(),
	)?.details;

	const { data: products = [], isLoading: isLoadingProducts } = trpc.products.getAll.useQuery(
		{ isActive: true },
		{ refetchOnWindowFocus: false },
	);

	return (
		<Controller
			control={control}
			name="items"
			defaultValue={[{ itemDescription: "" }]}
			render={({ field: { onChange, value } }) => {
				const items: Item[] = value ?? [];

				const updateItem = (index: number, updates: Partial<Item>) => {
					const next = [...items];
					next[index] = { ...next[index], ...updates };
					onChange(next);
				};

				const removeItem = (index: number) => {
					const next = [...items];
					next.splice(index, 1);
					onChange(next.length > 0 ? next : [{ itemDescription: "" }]);
				};

				const appendItem = () => {
					onChange([...items, { itemDescription: "" }]);
				};

				return (
					<div className="pt-24">
						<p className="text-2xl font-semibold pb-3">Quotation Details</p>
						<div className="flex flex-col gap-6">
							<div>
								<p className="pt-3 font-medium text-neutral-500">Select currency</p>
								<CurrencyInput />
							</div>
							<div>
								<p className="py-3 font-medium text-sm text-neutral-500">Items</p>
								{items.map((item, index) => (
									<QuotationItemRow
										key={index}
										item={item}
										index={index}
										currencyDetails={currencyDetails}
										products={products}
										isLoadingProducts={isLoadingProducts}
										updateItem={updateItem}
										removeItem={removeItem}
										itemsLength={items.length}
									/>
								))}
								<div className="py-3 border-dashed border-b border-gray-300">
									<button
										type="button"
										onClick={appendItem}
										className="flex justify-center items-center text-orange-500 font-medium text-sm gap-2"
									>
										<Plus className="w-4 h-4" />
										Add Item
									</button>
								</div>
							</div>
							<div>
								<p className="pt-3 font-medium text-sm text-neutral-500 pb-5">Note</p>
								<CustomTextInput placeholder="Add a note" variableName="note" />
							</div>
							<div>
								<p className="pt-3 font-medium text-sm text-neutral-500 pb-5">More options</p>
								<CustomNumberInput
									label="Discount"
									placeholder={`${currencyDetails?.currencySymbol ?? ""}0`}
									variableName="discount"
								/>
								<CustomNumberInput label="Taxable percentage" placeholder="0%" variableName="taxPercentage" />
							</div>
						</div>

					</div>
				);
			}}
		/>
	);
};

type Product = { id: string; name: string; etimsTaxTyCd?: string | null };
type Plan = {
	id: string;
	name: string;
	pricingModel: string;
	price: string | null;
	billingCycle?: string | null;
	commissionRate?: number | null;
};

const PLAN_CYCLE_MONTHS: Record<string, number> = {
	MONTHLY: 1,
	YEARLY: 12,
	BIENNIALLY: 24,
};

const QUOTATION_CYCLE_MONTHS: Record<string, number> = {
	monthly: 1,
	quarterly: 3,
	annually: 12,
	biennially: 24,
};

function quotationCycleFromPlan(planCycle: string | null | undefined): string | undefined {
	switch ((planCycle ?? "").toUpperCase()) {
		case "MONTHLY":
			return "monthly";
		case "YEARLY":
			return "annually";
		case "BIENNIALLY":
			return "biennially";
		default:
			return undefined;
	}
}

/** Scale a fixed plan's catalog price into the quotation billing cycle. */
function amountForQuotationCycle(plan: Plan, quotationCycle: string | undefined): number | undefined {
	if (plan.pricingModel !== "FIXED" || !plan.price) return undefined;
	const price = Number.parseFloat(plan.price);
	if (!Number.isFinite(price)) return undefined;

	const planMonths = PLAN_CYCLE_MONTHS[(plan.billingCycle ?? "").toUpperCase()];
	const targetMonths = quotationCycle ? QUOTATION_CYCLE_MONTHS[quotationCycle] : undefined;
	if (!planMonths || !targetMonths) return price;

	return Math.round((price / planMonths) * targetMonths * 100) / 100;
}

function QuotationItemRow({
	item,
	index,
	currencyDetails,
	products,
	isLoadingProducts,
	updateItem,
	removeItem,
	itemsLength,
}: {
	item: Item;
	index: number;
	currencyDetails: { currencySymbol?: string } | undefined;
	products: Product[];
	isLoadingProducts: boolean;
	updateItem: (index: number, updates: Partial<Item>) => void;
	removeItem: (index: number) => void;
	itemsLength: number;
}) {
	const selectedProductId = item.productId ?? "";
	const selectedPlanId = item.productPlanId ?? "";

	const { data: productWithPlans, isLoading: isLoadingPlans } = trpc.products.getById.useQuery(
		{ id: selectedProductId, includePlans: true },
		{ enabled: !!selectedProductId, refetchOnWindowFocus: false },
	);

	const plans = (productWithPlans as { plans?: Plan[] } | undefined)?.plans ?? [];

	const handleProductChange = (productId: string) => {
		if (!productId) {
			updateItem(index, {
				productId: undefined,
				productPlanId: undefined,
				commissionContext: undefined,
				etimsTaxTyCd: undefined,
				itemDescription: "",
				amount: undefined,
				qty: undefined,
			});
			return;
		}
		const product = products.find((p) => p.id === productId);
		updateItem(index, {
			productId,
			productPlanId: undefined,
			commissionContext: undefined,
			etimsTaxTyCd: product?.etimsTaxTyCd ?? undefined,
			itemDescription: product?.name ?? "",
			amount: undefined,
			qty: 1,
		});
	};

	const handlePlanChange = (planId: string) => {
		const plan = plans.find((p) => p.id === planId);
		if (!plan) {
			updateItem(index, { productPlanId: undefined, commissionContext: undefined, amount: undefined });
			return;
		}
		const billingCycle = quotationCycleFromPlan(plan.billingCycle);
		updateItem(index, {
			productPlanId: planId,
			commissionContext: undefined,
			billingCycle,
			itemDescription: [productWithPlans?.name, plan.name].filter(Boolean).join(" - ") || item.itemDescription,
			amount: amountForQuotationCycle(plan, billingCycle),
			qty: 1,
		});
	};

	const handleBillingCycleChange = (value: string) => {
		const billingCycle = value === "__unset__" ? undefined : value;
		const scaledAmount =
			selectedPlan && selectedPlan.pricingModel === "FIXED" ? amountForQuotationCycle(selectedPlan, billingCycle) : undefined;
		updateItem(index, {
			billingCycle,
			...(scaledAmount !== undefined ? { amount: scaledAmount } : {}),
		});
	};

	return (
		<div className="flex relative items-start group -ml-8 gap-2 flex-wrap pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0">
			<div className={cn("w-9 h-7 flex-shrink-0", itemsLength === 1 && "invisible")}>
				<button
					type="button"
					onClick={() => removeItem(index)}
					className="flex-shrink-0 rounded-md p-1.5 group-hover:bg-gray-50 hidden group-hover:block"
					aria-label="Remove item"
				>
					<Trash2 className="w-4 text-gray-500 h-4 group-hover:text-red-400" />
				</button>
			</div>

			<div className="flex-1 min-w-[200px] space-y-3">
				<Select
					value={selectedProductId || "__manual__"}
					onValueChange={(v) => handleProductChange(v === "__manual__" ? "" : v)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Choose source" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__manual__">Enter manually</SelectItem>
						{isLoadingProducts ? (
							<div className="flex items-center justify-center py-4">
								<Spinner size={20} />
							</div>
						) : (
							products.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									<span className="flex items-center gap-2">
										<Package className="h-3.5 w-3.5 text-muted-foreground" />
										{p.name}
									</span>
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>

				{selectedProductId && plans.length > 0 && (
					<Select value={selectedPlanId || ""} onValueChange={handlePlanChange}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select plan" />
						</SelectTrigger>
						<SelectContent>
							{isLoadingPlans ? (
								<div className="flex items-center justify-center py-4">
									<Spinner size={20} />
								</div>
							) : (
								plans.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
										{p.pricingModel === "COMMISSION" && p.commissionRate != null && (
											<span className="text-muted-foreground ml-1">({p.commissionRate}% commission)</span>
										)}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				)}

				<Input
					placeholder="Item name"
					value={item.itemDescription ?? ""}
					type="text"
					onChange={(e) => updateItem(index, { itemDescription: e.target.value })}
				/>

				<Select value={item.billingCycle || "__unset__"} onValueChange={handleBillingCycleChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Billing cycle (optional)" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__unset__">None</SelectItem>
						<SelectItem value="one-time">One Time</SelectItem>
						<SelectItem value="monthly">Monthly</SelectItem>
						<SelectItem value="quarterly">Quarterly</SelectItem>
						<SelectItem value="annually">Annually</SelectItem>
						<SelectItem value="biennially">Biennially</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="w-14 flex-shrink-0">
				<Input
					placeholder="Qty"
					value={item.qty != null ? String(item.qty) : ""}
					type="text"
					pattern="[0-9]*"
					onChange={(e) => {
						const v = e.target.value;
						if (/^-?\d*\.?\d*$/.test(v) || v === "") {
							updateItem(index, { qty: v === "" ? undefined : Number(v) });
						}
					}}
				/>
			</div>
			<div className="w-20 flex-shrink-0">
				<Input
					placeholder={currencyDetails?.currencySymbol ?? ""}
					value={item.amount != null ? String(item.amount) : ""}
					type="text"
					pattern="[0-9]*\.?[0-9]*"
					onChange={(e) => {
						const v = e.target.value;
						if (/^-?\d*\.?\d*$/.test(v) || v === "") {
							updateItem(index, { amount: v === "" ? undefined : Number(v) });
						}
					}}
				/>
			</div>
		</div>
	);
}

