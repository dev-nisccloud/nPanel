import type { LucideIcon } from "lucide-react";

export type HostingPlan = {
	id: string;
	name: string;
	niscPrice: string | null;
	niscCurrency?: string;
	billingCycle: string;
	isPopular: boolean;
	isRecommended: boolean;
	productId: string;
	productName?: string;
	featureValues: Array<{ available: boolean; valueOverride: string | null }>;
};

export type ProductFeatureRow = {
	key: string;
	label: string;
	description?: string;
};

export type HostingPlanFallbackFeature = {
	label: string;
	value: string;
	description: string;
};

export type CustomerHostingPlansPricingConfig = {
	title: string;
	planIcon: LucideIcon;
	highlightBadge: string;
	fallbackFeatures: HostingPlanFallbackFeature[];
};
