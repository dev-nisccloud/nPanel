const RESERVED_FIRST_PATH_SEGMENTS = new Set([
	"agency",
	"auth",
	"api",
	"login",
	"signup",
	"register",
	"terms",
	"privacy",
	"health",
	"invite",
]);

/** First path segment on customer portal routes (e.g. `/my-team/domains` → `my-team`). */
export function getCustomerTeamSlugFromPathname(pathname: string): string | undefined {
	const segment = pathname.split("/").filter(Boolean)[0];
	if (!segment) return undefined;
	if (RESERVED_FIRST_PATH_SEGMENTS.has(segment.toLowerCase())) return undefined;
	return segment;
}
