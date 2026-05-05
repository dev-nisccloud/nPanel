"use client";

import * as React from "react";
import { Cpu, CreditCard, HardDrive, HelpCircle, MemoryStick, Network, ShoppingCart } from "lucide-react";

import type { DedicatedPlan } from "../schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockBadge } from "./stock-badge";
import { DeploymentTimeBadge } from "../../_components/deployment-time-badge";
import { formatMoney, formatMoneyUsd } from "./money";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function getCpuBrand(productCpu: string | null | undefined): "intel" | "amd" {
	const name = (productCpu ?? "").toLowerCase();
	if (name.includes("amd")) return "amd";
	return "intel";
}

function stripHtmlToText(input?: string) {
	if (!input) return "";
	return input
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function getProcessorSummary(processorInfo: unknown) {
	if (!processorInfo || typeof processorInfo !== "object" || Array.isArray(processorInfo)) return null;
	const r = processorInfo as Record<string, unknown>;
	const cores = typeof r.cores === "number" ? r.cores : null;
	const threads = typeof r.threads === "number" ? r.threads : null;
	const sockets = typeof r.sockets === "number" ? r.sockets : null;
	const vcpus = typeof r.vcpus === "number" ? r.vcpus : null;
	return { cores, threads, sockets, vcpus };
}

function getDriveDescription(plan: DedicatedPlan) {
	const di = plan.product_drive_info;
	if (di && typeof di === "object" && !Array.isArray(di)) {
		const r = di as Record<string, unknown>;
		const desc = typeof r.description === "string" ? r.description : "";
		if (desc.trim().length > 0) return desc.trim();
	}
	return plan.product_drive || " ";
}

export function PlanCard({
	plan,
	locationName,
	displayCurrency = "KES",
	originalUsd,
	onAddToCart,
	onBuyNow,
}: {
	plan: DedicatedPlan;
	locationName: string;
	displayCurrency?: "KES" | "USD";
	originalUsd?: { monthly: number; hourly: number; monthlyKes?: number | null; hourlyKes?: number | null };
	onAddToCart?: (plan: DedicatedPlan) => void;
	onBuyNow?: (plan: DedicatedPlan) => void;
}) {
	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onAddToCart?.(plan);
	};

	const handleBuyNow = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onBuyNow?.(plan);
	};

	return (
		<Card className="group transition-all hover:shadow-md hover:border-primary/50 h-full flex flex-col">
			<CardHeader className="pb-3">
				{/* Top row: Logo and Badges */}
				<div className="flex items-start justify-between gap-3 mb-1">
					<div className="shrink-0">
						{(() => {
							const brand = getCpuBrand(plan.product_cpu);
							return (
								<img
									src={brand === "intel" ? "/intel.svg" : "/amd.svg"}
									alt={brand === "intel" ? "Intel" : "AMD"}
									className="h-12 w-12 object-contain"
								/>
							);
						})()}
					</div>
					<div className="flex flex-col items-end gap-2">
						{plan.product_new && <Badge variant="secondary">New</Badge>}
						<div className="flex items-center gap-2">
							<DeploymentTimeBadge type="dedicated" />
							<StockBadge stock={plan.stock} />
						</div>
					</div>
				</div>

				{/* Title row */}
				<CardTitle className="text-base font-semibold line-clamp-2" title={plan.product_name}>
					{plan.product_name}
				</CardTitle>
				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Available locations
							</p>
							<Tooltip>
								<TooltipTrigger asChild>
									<button type="button" className="text-muted-foreground hover:text-foreground">
										<HelpCircle className="h-3.5 w-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Available in the following locations</TooltipContent>
							</Tooltip>
						</div>
						<p className="text-sm font-semibold line-clamp-1">{locationName}</p>
					</div>

					{plan.product_on_sale && (
						<Badge variant="outline" className="border-primary text-primary">
							On sale
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="pt-0 flex-1 flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-3">
					{/* Product info */}
					<div className="rounded-lg border bg-muted/20 p-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Product info</p>
						<div className="flex flex-col gap-3 text-sm">
							{/* Bandwidth */}
							<div className="flex items-start gap-2">
								<Network className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bandwidth</p>
									<p className="font-semibold line-clamp-2 text-primary">{plan.product_bandwidth || " "}</p>
								</div>
							</div>

							{/* CPU */}
							<div className="flex items-start gap-2">
								<Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPU</p>
									<p className="font-semibold line-clamp-2 text-primary">{plan.product_cpu || " "}</p>
									{stripHtmlToText(plan.product_cpu_cores) ? (
										<p className="text-xs text-muted-foreground mt-0.5">{stripHtmlToText(plan.product_cpu_cores)}</p>
									) : null}
								</div>
							</div>

							{/* Processor Details */}
							{(() => {
								const info = getProcessorSummary(plan.processor_info);
								if (!info) return null;
								return (
									<>
										{info.vcpus ? (
											<div className="flex items-start gap-2">
												<Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
												<div className="min-w-0">
													<p className="text-xs font-medium text-muted-foreground tracking-wide"><span className="lowercase">v</span>CPU's</p>
													<p className="font-semibold line-clamp-2 text-primary">{info.vcpus}</p>
												</div>
											</div>
										) : null}

										{(info.cores || info.threads) ? (
											<div className="flex items-start gap-2">
												<Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
												<div className="flex gap-6 min-w-0">
													{info.cores ? (
														<div className="min-w-0">
															<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cores</p>
															<p className="font-semibold line-clamp-1 text-primary">{info.cores}</p>
														</div>
													) : null}
													{info.threads ? (
														<div className="min-w-0">
															<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Threads</p>
															<p className="font-semibold line-clamp-1 text-primary">{info.threads}</p>
														</div>
													) : null}
												</div>
											</div>
										) : null}
									</>
								);
							})()}

							{/* Memory */}
							<div className="flex items-start gap-2">
								<MemoryStick className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Memory</p>
									<p className="font-semibold line-clamp-2 text-primary">{plan.product_memory || " "}</p>
								</div>
							</div>

							{/* Drives */}
							<div className="flex items-start gap-2">
								<HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Drives</p>
									<p className="font-semibold line-clamp-2 text-primary">{getDriveDescription(plan)}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Price row */}
				<div className="mt-auto rounded-lg border bg-muted/20 p-3">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</p>
					<div className="mt-1 flex flex-col gap-0.5">
						{plan.product_on_sale && plan.product_original_price ? (
							<p className="text-xs text-muted-foreground line-through">
								{formatMoney(plan.product_original_price, displayCurrency)}
							</p>
						) : null}
						<p className="text-xl font-bold leading-tight text-primary">
							{formatMoney(plan.product_monthly_price, displayCurrency)}
							<span className="align-super text-xs font-semibold text-muted-foreground ml-1">/mo</span>
						</p>
						<p className="text-xs text-muted-foreground">
							{formatMoney(plan.product_hourly_price, displayCurrency)}{" "}
							<span className="align-super text-[10px]">/hr</span>
						</p>
						{originalUsd ? (
							<div className="mt-1 space-y-0.5">
								<p className="text-xs font-medium text-emerald-600">
									Original (USD): {formatMoneyUsd(originalUsd.monthly)} /mo · {formatMoneyUsd(originalUsd.hourly)} /hr
								</p>
								{typeof originalUsd.monthlyKes === "number" && typeof originalUsd.hourlyKes === "number" ? (
									<p className="text-xs font-medium text-emerald-600">
										Original (KES): {formatMoney(originalUsd.monthlyKes, "KES")} /mo · {formatMoney(originalUsd.hourlyKes, "KES")} /hr
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</div>

				{/* Buttons row */}
				<div className="flex justify-center gap-2 pt-1">
					<Button variant="outline" size="sm" onClick={handleAddToCart} className="w-auto">
						<ShoppingCart className="h-4 w-4 mr-2" />
						Add to cart
					</Button>
					<Button size="sm" onClick={handleBuyNow} className="w-auto bg-primary text-primary-foreground">
						<CreditCard className="h-4 w-4 mr-2" />
						Buy now
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

