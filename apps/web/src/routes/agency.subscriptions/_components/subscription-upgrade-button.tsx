"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";

type ButtonSize = "sm" | "default";

const DOMAIN_SERVICE_TYPES = new Set([
	"domains",
	"domain_registration",
	"domain_transfer",
]);

export function subscriptionHasNoUpgradeOption(params: {
	billingCycle?: string | null;
	serviceType?: string | null;
	productId?: string | null;
	productName?: string | null;
}): boolean {
	if (params.billingCycle === "ONE_TIME") return true;
	const serviceType = params.serviceType?.trim().toLowerCase() ?? "";
	if (serviceType && (DOMAIN_SERVICE_TYPES.has(serviceType) || serviceType.includes("domain"))) {
		return true;
	}
	const productId = params.productId?.trim().toLowerCase() ?? "";
	if (productId.includes("domain")) return true;
	const productName = params.productName?.trim().toLowerCase() ?? "";
	return productName === "domains" || productName.includes("domain registration");
}

type UpgradePlansData = {
	upgradeable: boolean;
	reason: string | null;
	productId: string;
	productName: string;
	teamId: string | null;
	currentPlanId: string | null;
	minSortOrder: number;
	primaryDomain: string | null;
};

interface SubscriptionUpgradeButtonProps {
	subscriptionId: string | null | undefined;
	teamSlug?: string | null;
	billingCycle?: string | null;
	serviceType?: string | null;
	productId?: string | null;
	productName?: string | null;
	size?: ButtonSize;
	className?: string;
	resolving?: boolean;
	preloaded?: UpgradePlansData | null;
	onUpgraded?: () => void;
}

function normalizeDomain(value?: string | null) {
	return value?.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") ?? "";
}

function pickTeamSubscriptionId(
	subs:
		| Array<{
				id: string;
				status?: string;
				productName?: string;
				pleskSubscriptionId?: string | null;
				wordpressInstallationId?: string | null;
				primaryDomain?: string | null;
				subscriptionName?: string | null;
		  }>
		| undefined,
	opts?: {
		pleskSubscriptionId?: string;
		installationId?: number;
		productNameIncludes?: string[];
		domain?: string | null;
	},
): string | null {
	if (!subs?.length) return null;
	const pleskId = opts?.pleskSubscriptionId ? String(opts.pleskSubscriptionId) : null;
	const installationId = opts?.installationId != null ? String(opts.installationId) : null;
	const needles = (opts?.productNameIncludes ?? []).map((s) => s.toLowerCase());
	const domain = normalizeDomain(opts?.domain);

	const matches = subs.filter((sub) => {
		if (pleskId && (sub.id === pleskId || sub.pleskSubscriptionId === pleskId)) return true;
		if (installationId && sub.wordpressInstallationId === installationId) return true;
		if (
			domain &&
			(normalizeDomain(sub.primaryDomain) === domain ||
				normalizeDomain(sub.subscriptionName) === domain)
		) {
			return true;
		}
		if (needles.length > 0) {
			const name = (sub.productName ?? "").toLowerCase();
			return needles.some((needle) => name.includes(needle));
		}
		return false;
	});

	const preferred =
		matches.find((s) => s.status === "ACTIVE" || s.status === "PENDING") ?? matches[0];
	return preferred?.id ?? null;
}

export function SubscriptionUpgradeButton({
	subscriptionId,
	teamSlug,
	billingCycle,
	serviceType,
	productId,
	productName,
	size = "sm",
	className,
	resolving = false,
	preloaded,
}: SubscriptionUpgradeButtonProps) {
	const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
	const utils = trpc.useUtils();
	const hiddenByKind = subscriptionHasNoUpgradeOption({
		billingCycle,
		serviceType,
		productId,
		productName,
	});
	const { data: fetched, isLoading, isError } = trpc.clientSubscriptions.listUpgradePlans.useQuery(
		{ subscriptionId: subscriptionId!, teamSlug: teamSlug ?? undefined },
		{
			enabled: !!subscriptionId && !hiddenByKind && !preloaded,
			staleTime: 60_000,
			refetchOnWindowFocus: false,
		},
	);
	const data = preloaded ?? fetched;

	React.useEffect(() => {
		if (!data?.upgradeable || !data.productId) return;
		void utils.products.getById.prefetch({ id: data.productId, includePlans: true });
	}, [data?.upgradeable, data?.productId, utils]);

	if (
		hiddenByKind ||
		data?.reason === "One-time services cannot be upgraded" ||
		data?.reason === "This service uses a separate upgrade flow"
	) {
		return null;
	}

	const disabled = resolving || !subscriptionId || isLoading || isError || !data?.upgradeable;
	const reason = resolving || isLoading
		? "Loading upgrade options"
		: !subscriptionId
			? "No linked subscription found"
			: isError
				? "Unable to load upgrade options"
				: (data?.reason ?? "No higher-priced plans available");

	const handleUpgrade = () => {
		if (!subscriptionId || !data?.upgradeable) return;
		openForProduct({
			productId: data.productId,
			productName: data.productName,
			teamId: data.teamId ?? undefined,
			upgrade: {
				subscriptionId,
				currentPlanId: data.currentPlanId,
				minSortOrder: data.minSortOrder,
				primaryDomain: data.primaryDomain,
			},
		});
	};

	const button = (
		<Button
			size={size}
			className={className}
			disabled={disabled}
			onClick={handleUpgrade}
		>
			<ArrowUpRight className="mr-2 h-4 w-4" />
			Upgrade
		</Button>
	);

	if (disabled) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">{button}</span>
				</TooltipTrigger>
				<TooltipContent>{reason}</TooltipContent>
			</Tooltip>
		);
	}

	return button;
}

/** Hosting / email detail pages are keyed by Plesk webspace id. */
export function PleskLinkedSubscriptionUpgradeButton({
	pleskSubscriptionId,
	teamSlug,
	domain,
	size = "sm",
	onUpgraded,
}: {
	pleskSubscriptionId: string | number;
	teamSlug?: string | null;
	domain?: string | null;
	size?: ButtonSize;
	onUpgraded?: () => void;
}) {
	const upgradeQuery = trpc.clientSubscriptions.listUpgradePlansByPleskId.useQuery(
		{
			pleskSubscriptionId,
			teamSlug: teamSlug ?? undefined,
			domain: domain ?? undefined,
		},
		{ staleTime: 60_000, refetchOnWindowFocus: false },
	);

	const subscriptionId = upgradeQuery.data?.subscriptionId ?? null;

	return (
		<SubscriptionUpgradeButton
			subscriptionId={subscriptionId}
			teamSlug={teamSlug}
			size={size}
			resolving={upgradeQuery.isLoading}
			preloaded={upgradeQuery.data ?? null}
			onUpgraded={onUpgraded}
		/>
	);
}

/** WordPress installation detail pages. */
export function WpLinkedSubscriptionUpgradeButton({
	installationId,
	teamSlug,
	size = "sm",
	onUpgraded,
}: {
	installationId: number;
	teamSlug?: string | null;
	size?: ButtonSize;
	onUpgraded?: () => void;
}) {
	const { data, isLoading } = trpc.clientSubscriptions.getLinkedIdByWpInstallationId.useQuery(
		{ installationId },
		{ staleTime: 60_000, refetchOnWindowFocus: false },
	);

	const subscriptionId = data?.subscriptionId ?? null;

	return (
		<SubscriptionUpgradeButton
			subscriptionId={subscriptionId}
			teamSlug={teamSlug}
			size={size}
			resolving={isLoading}
			onUpgraded={onUpgraded}
		/>
	);
}

/** Product-level details (SEO, email marketing, media buying) resolve the team's subscription. */
export function TeamProductUpgradeButton({
	teamSlug,
	productNameIncludes,
	size = "sm",
	onUpgraded,
}: {
	teamSlug?: string | null;
	productNameIncludes: string[];
	size?: ButtonSize;
	onUpgraded?: () => void;
}) {
	const { data, isLoading } = trpc.clientSubscriptions.listForTeam.useQuery(
		{ teamSlug: teamSlug ?? "" },
		{ enabled: !!teamSlug, staleTime: 60_000, refetchOnWindowFocus: false },
	);

	const subscriptionId = pickTeamSubscriptionId(data, { productNameIncludes });

	return (
		<SubscriptionUpgradeButton
			subscriptionId={subscriptionId}
			teamSlug={teamSlug}
			size={size}
			resolving={!!teamSlug && isLoading}
			onUpgraded={onUpgraded}
		/>
	);
}
