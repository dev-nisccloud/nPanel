/**
 * Hide registry/reseller vendor names from user-facing domain copy.
 * Agency UI/API may use OP / KC; customers never see provider names.
 */

const PROVIDER_NAME_RE = /open[\s-]?provider|kenic/i;

export const CUSTOMER_DOMAIN_ERROR_MESSAGE =
	"An error occurred. Please try again or contact support about your issue.";

export type DomainProviderAudience = "agency" | "customer";

export function isAgencyDomainAudienceRole(role?: string | null): boolean {
	return (
		role === "AGENCY_USER" ||
		role === "AGENCY_ADMIN" ||
		role === "AGENCY_SUPER_ADMIN"
	);
}

export function domainProviderAudienceFromContext(ctx?: {
	session?: { user?: { role?: string | null } | null } | null;
	apiKey?: unknown;
} | null): DomainProviderAudience {
	if (ctx?.apiKey) return "agency";
	if (isAgencyDomainAudienceRole(ctx?.session?.user?.role)) return "agency";
	return "customer";
}

export function mentionsDomainProvider(text: string | null | undefined): boolean {
	return typeof text === "string" && PROVIDER_NAME_RE.test(text);
}

export function abbreviateDomainProviderNames(text: string): string {
	return text.replace(/Open[\s-]?Provider/gi, "OP").replace(/\bkenic\b/gi, "KC");
}

export function sanitizeDomainProviderMessage(
	message: string | null | undefined,
	audience: DomainProviderAudience,
): string | null | undefined {
	if (message == null || message === "") return message;
	if (!mentionsDomainProvider(message)) return message;
	if (audience === "customer") return CUSTOMER_DOMAIN_ERROR_MESSAGE;
	return abbreviateDomainProviderNames(message);
}
