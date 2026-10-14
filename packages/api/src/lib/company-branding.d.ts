/** Canonical Nisc Cloud logos for invoices, credit notes, quotations, and PDFs. */
export declare const COMPANY_LOGO_PNG_URL = "https://storage.nisccloud.com/npanel-uploads/nisccloud/nisclogo.png";
export declare const COMPANY_LOGO_SVG_URL = "https://storage.nisccloud.com/npanel-uploads/nisccloud/nisclogo.svg";
/** Default raster logo (react-pdf is more reliable with PNG). */
export declare const COMPANY_LOGO_URL = "https://storage.nisccloud.com/npanel-uploads/nisccloud/nisclogo.png";
/** True when the stored logo URL points at an SVG (extension on the path). */
export declare function isSvgLogoUrl(url: string | null | undefined): boolean;
/** True when the stored logo URL points at a PNG. */
export declare function isPngLogoUrl(url: string | null | undefined): boolean;
/**
 * Map a stored/default logo URL onto the current CDN assets.
 * SVG originals stay SVG; PNG, extensionless (legacy Uploadthing), and empty become PNG.
 */
export declare function resolvePdfLogoUrl(url?: string | null): string;
