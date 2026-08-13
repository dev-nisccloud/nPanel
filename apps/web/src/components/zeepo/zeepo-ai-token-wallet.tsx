"use client";

import * as React from "react";
import { Link } from "react-router";
import { ChevronDown, Coins, Plus, Server, Zap } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useZeepoAiTokenBalance } from "@/hooks/use-zeepo-ai-token-balance";
import { useZeepoAiRoute } from "./zeepo-ai-route-context";
import { ZeepoAiBuyTokensDialog } from "./zeepo-ai-buy-tokens-dialog";

type Props = { className?: string };

function formatTokens(n: number): string {
	return Math.floor(n).toLocaleString();
}

function balanceTone(tokens: number): "healthy" | "low" | "critical" {
	if (tokens <= 10) return "critical";
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

function hostingHref(teamSlug: string | null): string {
	return teamSlug ? `/${teamSlug}/hosting` : "/dashboard/hosting";
}

/**
 * Customer: always show balance (0 if wallet not initialized) + Buy more.
 * No qualifying service → nudge to get hosting for free welcome tokens.
 * Agency: Unlimited.
 */
export function ZeepoAiTokenWallet({ className }: Props) {
	const { teamId, teamSlug, isCustomer } = useZeepoAiRoute();
	const { data: session } = authClient.useSession();
	const userRole = (session?.user as { role?: string } | undefined)?.role;
	const {
		isAgency,
		tokens,
		isLoading,
		hasQualifyingService,
		walletInitialized,
		welcomeTokenGrant,
	} = useZeepoAiTokenBalance(teamId, userRole);
	const [buyOpen, setBuyOpen] = React.useState(false);

	if (isAgency) {
		return (
			<div
				className={cn(
					"inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground",
					className,
				)}
			>
				<Zap className="size-3.5" />
				Unlimited
			</div>
		);
	}

	if (!isCustomer || !teamId) return null;

	if (isLoading) {
		return <Skeleton className={cn("h-8 w-40 rounded-full", className)} />;
	}

	const balance = tokens ?? 0;
	const tone = balanceTone(balance);
	const styles = toneStyles[tone];
	const displayTokens = formatTokens(balance);
	const needsService = !hasQualifyingService;
	const hostingPath = hostingHref(teamSlug);

	return (
		<>
			<div className={cn("flex shrink-0 items-center gap-2", className)}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className={cn(
								"flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all",
								"hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								styles.pill,
							)}
							aria-label={`${displayTokens} Zeepo AI tokens`}
						>
							<Coins className={cn("size-3.5 shrink-0", styles.icon)} strokeWidth={2} />
							<span className="tabular-nums">
								{displayTokens}
								<span className="font-medium opacity-80"> tokens</span>
							</span>
							<ChevronDown className="size-3 shrink-0 opacity-60" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-64">
						<DropdownMenuLabel className="font-normal">
							<div className="flex flex-col gap-1">
								<span className="text-xs text-muted-foreground">Team balance</span>
								<span className="flex items-center gap-2 text-base font-bold tabular-nums">
									<Zap className={cn("size-4", styles.icon)} />
									{displayTokens} tokens
								</span>
								{!walletInitialized && (
									<span className="text-[11px] font-normal leading-snug text-muted-foreground">
										Wallet not started yet  balance is 0 until you unlock free credits or buy a pack.
									</span>
								)}
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{needsService ? (
							<>
								<div className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
									Add a hosting plan (or any active service) to unlock{" "}
									<span className="font-semibold text-foreground">
										{welcomeTokenGrant} free tokens
									</span>{" "}
									for your team.
								</div>
								<DropdownMenuItem asChild className="cursor-pointer gap-2 font-medium">
									<Link to={hostingPath as never}>
										<Server className="size-4 text-primary" />
										Get hosting for free credits
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</>
						) : null}
						<DropdownMenuItem
							className="cursor-pointer gap-2 font-medium"
							onSelect={() => setBuyOpen(true)}
						>
							<Plus className="size-4 text-amber-600 dark:text-amber-400" />
							Buy more tokens
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{needsService ? (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-8 gap-1 rounded-full px-3 text-xs"
						asChild
					>
						<Link to={hostingPath as never}>
							<Server className="size-3.5" />
							Get free credits
						</Link>
					</Button>
				) : (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-8 gap-1 rounded-full px-3 text-xs"
						onClick={() => setBuyOpen(true)}
					>
						<Plus className="size-3.5" />
						Buy more
					</Button>
				)}
			</div>
			<ZeepoAiBuyTokensDialog open={buyOpen} onOpenChange={setBuyOpen} initialStep="plans" />
		</>
	);
}

/** Inline banner for home / empty states when the team has no qualifying service. */
export function ZeepoAiFreeCreditsNudge({
	className,
	compact = false,
}: {
	className?: string;
	compact?: boolean;
}) {
	const { teamId, teamSlug, isCustomer } = useZeepoAiRoute();
	const { data: session } = authClient.useSession();
	const userRole = (session?.user as { role?: string } | undefined)?.role;
	const { isAgency, hasQualifyingService, welcomeTokenGrant, isLoading } = useZeepoAiTokenBalance(
		teamId,
		userRole,
	);

	if (!isCustomer || isAgency || !teamId || isLoading || hasQualifyingService) return null;

	const hostingPath = hostingHref(teamSlug);

	if (compact) {
		return (
			<div
				className={cn(
					"flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground",
					className,
				)}
			>
				<p className="min-w-0 flex-1 truncate">
					Unlock {welcomeTokenGrant} free tokens with hosting
				</p>
				<Button type="button" size="sm" className="h-7 shrink-0 gap-1 px-2.5 text-xs" asChild>
					<Link to={hostingPath as never}>
						<Server className="size-3.5" />
						Get hosting
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground",
				className,
			)}
		>
			<p className="font-medium">Unlock {welcomeTokenGrant} free Zeepo AI tokens</p>
			<p className="mt-1 text-muted-foreground leading-relaxed">
				Your balance is 0 because this team doesn’t have an active service yet. Get hosting (or
				another subscription) with us and we’ll credit {welcomeTokenGrant} free tokens to try Zeepo
				AI  no invoice for that welcome grant.
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button type="button" size="sm" className="gap-1.5" asChild>
					<Link to={hostingPath as never}>
						<Server className="size-3.5" />
						Browse hosting
					</Link>
				</Button>
			</div>
		</div>
	);
}
