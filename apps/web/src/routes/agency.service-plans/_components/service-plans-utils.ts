import { type ServicePlanType } from "./schema";

/**
 * Get display name for plan type
 */
export function getPlanTypeDisplayName(planType: ServicePlanType): string {
	const displayNames: Record<ServicePlanType, string> = {
		HOSTING: "Hosting",
		SEO: "SEO",
		VIDEOGRAPHY: "Videography",
		VISUAL_CREATIVE: "Visual Creative",
		SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
		PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
	};
	return displayNames[planType] || planType;
}

/**
 * Get display name for hosting sub-type
 */
export function getHostingSubTypeDisplayName(subType: string): string {
	const displayNames: Record<string, string> = {
		WEB_HOSTING: "Web Hosting",
		EMAIL_HOSTING: "Email Hosting",
		RESELLER_HOSTING: "Reseller Hosting",
		VPS_HOSTING: "VPS Hosting",
		DEDICATED_HOSTING: "Dedicated Hosting",
	};
	return displayNames[subType] || subType;
}

/**
 * Get display name for billing cycle
 */
export function getBillingCycleDisplayName(cycle: string): string {
	const displayNames: Record<string, string> = {
		MONTHLY: "Monthly",
		YEARLY: "Yearly",
		BIENNIALLY: "Biennially",
		CUSTOM: "Custom",
	};
	return displayNames[cycle] || cycle;
}

/**
 * Get badge variant for plan status
 */
export function getPlanStatusBadgeVariant(isActive: boolean): "default" | "secondary" | "destructive" {
	return isActive ? "default" : "secondary";
}

