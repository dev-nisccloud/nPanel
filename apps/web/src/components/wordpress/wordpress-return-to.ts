const HOSTING_DETAIL_TABS = new Set([
	"overview",
	"dns",
	"mail",
	"file-manager",
	"subdomains",
	"databases",
	"wordpress",
	"backup-restore",
]);

const HOSTING_DETAIL_PATH = /^\/(?:agency|[^/]+)\/hosting\/[^/?#]+$/;

export function hostingDetailTabFromSearch(tab: string | null): string {
	if (tab && HOSTING_DETAIL_TABS.has(tab)) return tab;
	return "overview";
}

/** Hosting details URL to restore, including the WordPress tab. */
export function hostingWordPressReturnPath(pathname: string): string {
	const path = pathname.split("?")[0] ?? pathname;
	return `${path}?tab=wordpress`;
}

/**
 * Accept only an in-app hosting details path. Anything else is ignored so Back
 * falls through to the WordPress list.
 */
export function resolveHostingWordPressReturnTo(raw: string | null): string | null {
	if (!raw) return null;

	let decoded = raw;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		return null;
	}

	if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;

	let url: URL;
	try {
		url = new URL(decoded, "http://npanel.local");
	} catch {
		return null;
	}

	if (url.origin !== "http://npanel.local") return null;
	if (!HOSTING_DETAIL_PATH.test(url.pathname)) return null;

	const tab = url.searchParams.get("tab");
	if (tab && tab !== "wordpress") return null;
	return tab === "wordpress" ? `${url.pathname}?tab=wordpress` : url.pathname;
}
