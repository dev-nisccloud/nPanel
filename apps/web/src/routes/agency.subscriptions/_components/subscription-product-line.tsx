"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import {
	formatMoney,
	getServiceDef,
	lineField,
	catalogSubscriptionPrice,
	normalizeBillingCycle,
	normalizeDomainInput,
	SERVICE_PRODUCTS,
	validateDomainName,
	type CatalogPlanOption,
	type CreateFormData,
	type LineQuote,
	type LineValues,
} from "./create-subscription-order";

type PortfolioDomain = { id: string; domainName: string };

export function SubscriptionProductLine({
	index,
	line,
	form,
	quote,
	plans,
	plansLoading,
	hostingProductId,
	open,
	isBusy,
	canRemove,
	onRemove,
	domainItems,
	allDomains,
	loadingDomains,
	notice,
}: {
	index: number;
	line: LineValues;
	form: UseFormReturn<CreateFormData>;
	quote: LineQuote;
	plans: CatalogPlanOption[];
	plansLoading: boolean;
	hostingProductId: string | null;
	open: boolean;
	isBusy: boolean;
	canRemove: boolean;
	onRemove: () => void;
	domainItems: ComboboxItem[];
	allDomains: PortfolioDomain[];
	loadingDomains: boolean;
	notice?: string | null;
}) {
	const def = getServiceDef(line.serviceProduct);
	const isZeepo = line.serviceProduct === "zeepo_ai_agent";
	const isOneTime = line.serviceProduct === "one_time_service";
	const selectedPlan = quote.plan;
	const domainLookup = validateDomainName(line.primaryDomain ?? "");
	const normalizedDomain = domainLookup.ok ? domainLookup.normalized : "";

	const pleskMatch = trpc.clientSubscriptions.matchCatalogPlanForPleskWebspace.useQuery(
		{
			domain: normalizedDomain,
			productId: hostingProductId ?? "",
		},
		{
			enabled: open && def.needsDomain && Boolean(hostingProductId) && domainLookup.ok,
			staleTime: 60_000,
			refetchOnWindowFocus: false,
		},
	);

	const seenProduct = React.useRef(line.serviceProduct);
	React.useEffect(() => {
		if (seenProduct.current === line.serviceProduct) return;
		seenProduct.current = line.serviceProduct;
		const next = getServiceDef(line.serviceProduct);
		form.setValue(lineField(index, "planId"), "");
		form.setValue(lineField(index, "billingCycle"), next.defaultBillingCycle);
		form.setValue(lineField(index, "serviceName"), "");
		form.setValue(lineField(index, "customPrice"), "");
		form.setValue(lineField(index, "linePrice"), "");
		form.setValue(lineField(index, "overrideTokens"), false);
		form.setValue(lineField(index, "tokenGrant"), "");
		form.setValue(lineField(index, "primaryDomain"), "");
		form.setValue(lineField(index, "portfolioDomainId"), "");
	}, [line.serviceProduct, form, index]);

	const applyPlanPrice = React.useCallback(
		(plan: CatalogPlanOption, cycle: string) => {
			const price = catalogSubscriptionPrice(plan, cycle);
			if (price > 0) form.setValue(lineField(index, "linePrice"), String(price));
		},
		[form, index],
	);

	const appliedPlanId = React.useRef("");
	React.useEffect(() => {
		if (!selectedPlan) {
			appliedPlanId.current = "";
			return;
		}
		if (appliedPlanId.current === selectedPlan.id) return;
		appliedPlanId.current = selectedPlan.id;
		const cycle =
			selectedPlan.zeepoPlanType === "top_up" ? "CUSTOM" : normalizeBillingCycle(selectedPlan.billingCycle);
		form.setValue(lineField(index, "billingCycle"), cycle);
		applyPlanPrice(selectedPlan, cycle);
		if (def.supportsZeepoTokens && selectedPlan.tokenGrant != null && !line.overrideTokens) {
			form.setValue(lineField(index, "tokenGrant"), String(selectedPlan.tokenGrant));
		}
	}, [selectedPlan, form, index, def.supportsZeepoTokens, line.overrideTokens, applyPlanPrice]);

	const appliedPleskKey = React.useRef("");
	React.useEffect(() => {
		const key = `${line.serviceProduct}:${normalizedDomain}`;
		if (!pleskMatch.isFetching && pleskMatch.data?.matchedPlanId && normalizedDomain) {
			if (appliedPleskKey.current === key) return;
			appliedPleskKey.current = key;
			form.setValue(lineField(index, "planId"), pleskMatch.data.matchedPlanId);
			return;
		}
		if (appliedPleskKey.current.startsWith(`${line.serviceProduct}:`) && appliedPleskKey.current !== key) {
			appliedPleskKey.current = "";
		}
	}, [
		pleskMatch.isFetching,
		pleskMatch.data?.matchedPlanId,
		line.serviceProduct,
		normalizedDomain,
		form,
		index,
	]);

	const loadingPlans = plansLoading || pleskMatch.isFetching;

	return (
		<div className="rounded-lg border p-4 space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h4 className="text-sm font-medium">Product {index + 1}</h4>
					{quote.exVat > 0 ? (
						<p className="text-xs text-muted-foreground">{formatMoney(quote.exVat, quote.currency)} before tax</p>
					) : null}
				</div>
				{canRemove ? (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onRemove}
						disabled={isBusy}
						aria-label={`Remove product ${index + 1}`}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				) : null}
			</div>

			<FormField
				control={form.control}
				name={lineField(index, "serviceProduct")}
				render={({ field }) => (
					<FormItem>
						<FormLabel>Product</FormLabel>
						<Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
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
						{isZeepo ? (
							<FormDescription>One Zeepo subscription per organization.</FormDescription>
						) : (
							<FormDescription>Service included on this order.</FormDescription>
						)}
						{notice ? <p className="text-sm text-destructive">{notice}</p> : null}
						<FormMessage />
					</FormItem>
				)}
			/>

			{isOneTime ? (
				<>
					<FormField
						control={form.control}
						name={lineField(index, "serviceName")}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Service name</FormLabel>
								<FormControl>
									<Input placeholder="e.g. Website design" {...field} value={field.value ?? ""} disabled={isBusy} />
								</FormControl>
								<FormDescription>How this service appears on the subscription.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name={lineField(index, "customPrice")}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price (KES, before VAT)</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										step={1}
										inputMode="decimal"
										placeholder="0"
										{...field}
										value={field.value ?? ""}
										disabled={isBusy}
									/>
								</FormControl>
								<FormDescription>Charge before VAT.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			) : null}

			{def.needsPlan ? (
				<FormField
					control={form.control}
					name={lineField(index, "planId")}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Plan</FormLabel>
							{loadingPlans ? (
								<Skeleton className="h-10 w-full" />
							) : (
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									const plan = plans.find((item) => item.id === value);
									if (!plan) return;
									const cycle =
										plan.zeepoPlanType === "top_up" ? "CUSTOM" : normalizeBillingCycle(plan.billingCycle);
									form.setValue(lineField(index, "billingCycle"), cycle);
									applyPlanPrice(plan, cycle);
								}}
								value={field.value || undefined}
								disabled={isBusy || plans.length === 0}
							>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select plan" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{plans.map((plan) => (
											<SelectItem key={plan.id} value={plan.id}>
												{isZeepo ? (
													<>
														{plan.name} {(plan.tokenGrant ?? 0).toLocaleString()} tokens (
														{plan.zeepoPlanType === "top_up" ? "top-up" : "subscription"})
													</>
												) : (
													<>
														{plan.name} {plan.displayCurrency}{" "}
														{Math.ceil(plan.displayPrice).toLocaleString()} / {plan.billingCycle.toLowerCase()}
													</>
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							{!loadingPlans && plans.length === 0 ? (
								<FormDescription className="text-destructive">No plans are available.</FormDescription>
							) : null}
							{pleskMatch.data?.plesk?.planName ? (
								<FormDescription>
									{pleskMatch.data.matchedPlanId
										? `Plesk plan: ${pleskMatch.data.plesk.planName}`
										: `“${pleskMatch.data.plesk.planName}” is not in the catalog.`}
								</FormDescription>
							) : null}
							<FormDescription>Package for this service.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			) : null}

			{!isOneTime ? (
				<FormField
					control={form.control}
					name={lineField(index, "billingCycle")}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Billing cycle</FormLabel>
							<Select
								onValueChange={(value) => {
									field.onChange(value);
									if (selectedPlan) applyPlanPrice(selectedPlan, value);
								}}
								value={field.value && field.value !== "ONE_TIME" ? field.value : undefined}
								disabled={isBusy}
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select billing cycle" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="MONTHLY">Monthly</SelectItem>
									<SelectItem value="YEARLY">Yearly</SelectItem>
									<SelectItem value="BIENNIALLY">Biennially</SelectItem>
									<SelectItem value="TRIENNIALLY">Triennially</SelectItem>
									<SelectItem value="QUADRENNIALLY">Quadrennially</SelectItem>
									<SelectItem value="CUSTOM">Custom</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>How often this subscription renews.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			) : null}

			{!isOneTime ? (
				<FormField
					control={form.control}
					name={lineField(index, "linePrice")}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Price ({quote.currency || "KES"}, before VAT)</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									step={1}
									inputMode="numeric"
									placeholder={quote.catalogExVat > 0 ? String(quote.catalogExVat) : "0"}
									{...field}
									value={field.value ?? ""}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={(event) => {
										const amount = Number.parseFloat(event.target.value);
										if (Number.isFinite(amount) && amount > 0) field.onChange(String(Math.ceil(amount)));
										field.onBlur();
									}}
									disabled={isBusy || !selectedPlan}
								/>
							</FormControl>
							<FormDescription>
								{selectedPlan ? "Price for this cycle, before tax." : "Select a plan to price this product."}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			) : null}

			{isZeepo && selectedPlan ? (
				<>
					<FormField
						control={form.control}
						name={lineField(index, "overrideTokens")}
						render={({ field }) => (
							<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) => {
											const next = Boolean(checked);
											field.onChange(next);
											if (next && selectedPlan.tokenGrant != null) {
												form.setValue(lineField(index, "tokenGrant"), String(selectedPlan.tokenGrant));
											}
										}}
										disabled={isBusy}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Override token grant</FormLabel>
									<FormDescription>
										Plan includes {(selectedPlan.tokenGrant ?? 0).toLocaleString()} tokens.
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>
					{line.overrideTokens ? (
						<FormField
							control={form.control}
							name={lineField(index, "tokenGrant")}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tokens to grant</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											step={1}
											placeholder={String(selectedPlan.tokenGrant ?? 0)}
											{...field}
											value={field.value ?? ""}
											disabled={isBusy}
										/>
									</FormControl>
									<FormDescription>Tokens credited with this subscription.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : null}
				</>
			) : null}

			{def.needsDomain ? (
				<>
					<FormField
						control={form.control}
						name={lineField(index, "portfolioDomainId")}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Select from portfolio (optional)</FormLabel>
								{loadingDomains ? (
									<Skeleton className="h-10 w-full" />
								) : (
									<ComboboxDropdown
										items={domainItems}
										selectedItem={domainItems.find((item) => item.id === field.value)}
										onSelect={(item) => {
											field.onChange(item.id);
											const selected = allDomains.find((domain) => domain.id === item.id);
											if (selected) {
												form.setValue(lineField(index, "primaryDomain"), selected.domainName, {
													shouldValidate: true,
												});
											}
										}}
										placeholder="Select domain from portfolio"
										searchPlaceholder="Search domains..."
										emptyResults="No domains found in portfolio"
										disabled={isBusy}
									/>
								)}
								<FormDescription>A domain already on this account.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name={lineField(index, "primaryDomain")}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Domain name</FormLabel>
								<FormControl>
									<Input
										placeholder="example.com"
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
										inputMode="url"
										{...field}
										value={field.value ?? ""}
										onChange={(event) => field.onChange(event.target.value.trimStart())}
										onBlur={(event) => {
											const result = validateDomainName(event.target.value);
											if (result.ok) {
												field.onChange(result.normalized);
											} else {
												const normalized = normalizeDomainInput(event.target.value);
												if (normalized && normalized !== event.target.value) field.onChange(normalized);
											}
											field.onBlur();
											void form.trigger(lineField(index, "primaryDomain"));
										}}
										disabled={isBusy}
									/>
								</FormControl>
								<FormDescription>The address for this hosting plan.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			) : null}
		</div>
	);
}
