"use client";

import * as React from "react";
import { ChevronDown, Coins, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useZeepoTokenBalance } from "@/hooks/use-zeepo-token-balance";
import { useZeepoAgentRoute } from "./zeepo-agent-route-context";
import { useZeepoTokenBilling } from "./zeepo-token-billing-provider";

type ZeepoTokenWalletProps = {
	className?: string;
};

function formatTokens(n: number): string {
	return Math.floor(n).toLocaleString();
}

function balanceTone(tokens: number | null): "healthy" | "low" | "critical" {
	if (tokens == null || tokens <= 10) return "critical";
	if (tokens <= 50) return "low";
	return "healthy";
}

const toneStyles = {
	healthy: {
		pill: "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200",
		icon: "text-green-700 dark:text-green-300",
	},
	low: {
		pill: "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-950 dark:text-amber-100",
		icon: "text-amber-600 dark:text-amber-400",
	},
	critical: {
		pill: "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200",
		icon: "text-red-700 dark:text-red-300",
	},
} as const;

export function ZeepoTokenWallet({ className }: ZeepoTokenWalletProps) {
	const { teamId, isCustomer } = useZeepoAgentRoute();
	const { data: session } = authClient.useSession();
	const userRole = (session?.user as { role?: string } | undefined)?.role;
	const { isAgency, tokens, hasSubscription, isLoading } = useZeepoTokenBalance(
		teamId,
		userRole,
	);
	const { openTopUpPurchase } = useZeepoTokenBilling();

	if (!isCustomer || isAgency || !teamId || !hasSubscription) return null;

	if (isLoading) {
		return <Skeleton className={cn("h-8 w-36 rounded-full", className)} />;
	}

	const tone = balanceTone(tokens);
	const styles = toneStyles[tone];
	const displayTokens = formatTokens(tokens ?? 0);

	const handlePurchase = () => openTopUpPurchase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all",
						"hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						styles.pill,
						className,
					)}
					aria-label={`${displayTokens} Zeepo tokens available. Open menu to purchase more.`}
				>
					<Coins className={cn("size-3.5 shrink-0", styles.icon)} strokeWidth={2} />
					<span className="tabular-nums">
						{displayTokens}
						<span className="font-medium opacity-80"> tokens</span>
					</span>
					<ChevronDown className="size-3 shrink-0 opacity-60" />
				</button>
			</DropdownMenuTrigger>
			<ZeepoTokenWalletMenuContent
				displayTokens={displayTokens}
				tone={tone}
				onPurchase={handlePurchase}
			/>
		</DropdownMenu>
	);
}

function ZeepoTokenWalletMenuContent({
	displayTokens,
	tone,
	onPurchase,
}: {
	displayTokens: string;
	tone: keyof typeof toneStyles;
	onPurchase: () => void;
}) {
	return (
		<DropdownMenuContent align="start" className="w-56">
			<DropdownMenuLabel className="font-normal">
				<div className="flex flex-col gap-1">
					<span className="text-xs text-muted-foreground">Available balance</span>
					<span className="flex items-center gap-2 text-base font-bold tabular-nums">
						<Zap
							className={cn(
								"size-4",
								tone === "critical"
									? "text-red-600 dark:text-red-400"
									: tone === "low"
										? "text-amber-500"
										: "text-green-600 dark:text-green-400",
							)}
						/>
						{displayTokens} tokens
					</span>
				</div>
			</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				className="cursor-pointer gap-2 font-medium"
				onSelect={onPurchase}
			>
				<Plus className="size-4 text-amber-600 dark:text-amber-400" />
				Purchase more tokens
			</DropdownMenuItem>
		</DropdownMenuContent>
	);
}
