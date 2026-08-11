"use client";

import * as React from "react";
import { ArrowLeft, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	useZeepoAiPlanCheckout,
	useZeepoAiPurchasePlans,
	type ZeepoAiPurchasePlan,
} from "@/hooks/use-zeepo-ai-purchase-plans";
import { trpc } from "@/utils/trpc";
import { zeepoTokenBalanceQueryOptions } from "@/lib/zeepo-token-balance-query";
import { useZeepoAiRoute } from "./zeepo-ai-route-context";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialStep?: "alert" | "plans";
};

function formatKes(amount: number): string {
	return new Intl.NumberFormat("en-KE", {
		style: "currency",
		currency: "KES",
		maximumFractionDigits: 0,
	}).format(amount);
}

function PlanCard({
	plan,
	onSelect,
}: {
	plan: ZeepoAiPurchasePlan;
	onSelect: (plan: ZeepoAiPurchasePlan) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(plan)}
			className={cn(
				"group relative flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all",
				"hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				plan.isPopular && "border-primary/30 ring-1 ring-primary/20",
			)}
		>
			{(plan.isPopular || plan.isRecommended) && (
				<Badge
					variant="secondary"
					className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-wide"
				>
					{plan.isPopular ? "Popular" : "Recommended"}
				</Badge>
			)}
			<p className="text-sm font-semibold text-foreground">{plan.name}</p>
			<p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
				{plan.description ?? "Add tokens to your team wallet."}
			</p>
			<div className="flex items-end justify-between gap-2">
				<p className="text-xl font-bold tabular-nums text-primary">
					{formatKes(plan.displayPrice)}
				</p>
				<span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
					Select
				</span>
			</div>
		</button>
	);
}

export function ZeepoAiBuyTokensDialog({
	open,
	onOpenChange,
	initialStep = "plans",
}: Props) {
	const { teamId } = useZeepoAiRoute();
	const [step, setStep] = React.useState<"alert" | "plans">(initialStep);
	const { data: balance } = trpc.zeepoAi.billing.getTokenBalance.useQuery(
		{ teamId: teamId! },
		zeepoTokenBalanceQueryOptions(Boolean(teamId) && open),
	);
	const { plans, isLoading } = useZeepoAiPurchasePlans();
	const { openCheckout, checkoutDialog } = useZeepoAiPlanCheckout();

	React.useEffect(() => {
		if (open) setStep(initialStep);
	}, [open, initialStep]);

	const tokenCount = balance?.tokens != null ? Math.floor(balance.tokens) : 0;

	const handlePlanSelect = (plan: ZeepoAiPurchasePlan) => {
		openCheckout(plan);
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className={cn(
						"gap-0 overflow-hidden p-0 sm:max-w-lg",
						step === "plans" && "sm:max-w-2xl",
					)}
				>
					{step === "alert" ? (
						<>
							<div className="relative overflow-hidden px-6 pt-8 pb-2">
								<div className="relative flex flex-col items-center text-center">
									<div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 ring-1 ring-amber-500/20">
										<Coins className="size-7 text-amber-600 dark:text-amber-400" />
									</div>
									<DialogHeader className="space-y-2 sm:text-center">
										<DialogTitle className="text-xl">Need more tokens?</DialogTitle>
										<DialogDescription className="text-sm leading-relaxed">
											Buy a top-up pack. Tokens are added to your team wallet after payment.
										</DialogDescription>
									</DialogHeader>
									<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
										<Zap className="size-3.5" />
										<span className="tabular-nums">
											{tokenCount.toLocaleString()} tokens remaining
										</span>
									</div>
								</div>
							</div>
							<DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
								<Button type="button" className="w-full" onClick={() => setStep("plans")}>
									Buy more tokens
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="w-full text-muted-foreground"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<div className="flex items-center gap-2 border-b px-4 py-3">
								{initialStep !== "plans" && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 shrink-0"
										onClick={() => setStep("alert")}
										aria-label="Back"
									>
										<ArrowLeft className="size-4" />
									</Button>
								)}
								<div className="min-w-0 flex-1 py-0.5">
									<DialogTitle className="text-base">Buy Zeepo AI tokens</DialogTitle>
									<DialogDescription className="text-sm">
										One-time packs. An invoice is created when you purchase.
									</DialogDescription>
								</div>
							</div>
							<ScrollArea className="max-h-[min(60vh,28rem)] px-4 py-4">
								{isLoading ? (
									<div className="grid gap-3 sm:grid-cols-2">
										{[1, 2, 3].map((i) => (
											<Skeleton key={i} className="h-36 rounded-xl" />
										))}
									</div>
								) : plans.length === 0 ? (
									<p className="py-8 text-center text-sm text-muted-foreground">
										No packs available right now. Please try again later.
									</p>
								) : (
									<div className="grid gap-3 sm:grid-cols-2">
										{plans.map((plan) => (
											<PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} />
										))}
									</div>
								)}
							</ScrollArea>
							<DialogFooter className="border-t bg-muted/20 px-4 py-3">
								<Button
									type="button"
									variant="outline"
									className="w-full sm:w-auto"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
			{checkoutDialog}
		</>
	);
}
