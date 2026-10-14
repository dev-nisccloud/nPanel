/** Canonical Nisc Cloud logos for invoices, credit notes, quotations, and PDFs. */
export const COMPANY_LOGO_PNG_URL =
	"https://storage.nisccloud.com/npanel-uploads/nisccloud/nisclogo.png";
export const COMPANY_LOGO_SVG_URL =
	"https://storage.nisccloud.com/npanel-uploads/nisccloud/nisclogo.svg";

/** Default raster logo (react-pdf is more reliable with PNG). */
export const COMPANY_LOGO_URL = COMPANY_LOGO_PNG_URL;

function logoPathname(url: string): string {
	const trimmed = url.trim();
	try {
		return new URL(trimmed).pathname;
	} catch {
		return trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
	}
}

/** True when the stored logo URL points at an SVG (extension on the path). */
export function isSvgLogoUrl(url: string | null | undefined): boolean {
	if (!url?.trim()) return false;
	return /\.svg$/i.test(logoPathname(url));
}

/** True when the stored logo URL points at a PNG. */
export function isPngLogoUrl(url: string | null | undefined): boolean {
	if (!url?.trim()) return false;
	return /\.png$/i.test(logoPathname(url));
}

/**
 * Map a stored/default logo URL onto the current CDN assets.
 * SVG originals stay SVG; PNG, extensionless (legacy Uploadthing), and empty become PNG.
 */
export function resolvePdfLogoUrl(url?: string | null): string {
	return isSvgLogoUrl(url) ? COMPANY_LOGO_SVG_URL : COMPANY_LOGO_PNG_URL;
}
