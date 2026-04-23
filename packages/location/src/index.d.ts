/**
 * Geo/locale hints from request headers (e.g. `x-vercel-ip-*` on Vercel).
 * Pass `request.headers` from your server (Hono, RR resource route, etc.).
 * In the browser, there are no geo headers   defaults apply.
 */
export declare function getCountryCodeSync(headers?: Headers): string;
export declare function getTimezoneSync(headers?: Headers): string;
export declare function getLocaleSync(headers?: Headers): string;
/** @deprecated Prefer `getCountryCodeSync(headers)` with request headers on the server. */
export declare function getCountryCode(headers?: Headers): Promise<string>;
/** @deprecated Prefer `getTimezoneSync(headers)`. */
export declare function getTimezone(headers?: Headers): Promise<string>;
/** @deprecated Prefer `getLocaleSync(headers)`. */
export declare function getLocale(headers?: Headers): Promise<string>;
export declare function getTimezones(): {
    label: string;
    tzCode: string;
    name: string;
    utc: string;
}[];
export declare function getCurrency(headers?: Headers): Promise<string>;
export declare function getDateFormat(headers?: Headers): Promise<"MM/dd/yyyy" | "yyyy-MM-dd" | "dd/MM/yyyy">;
export declare function isEU(headers?: Headers): Promise<boolean>;
export declare function getCountry(headers?: Headers): Promise<{
    code: string;
    unicode: string;
    name: string;
    emoji: string;
} | undefined>;
export { countries } from "./countries-intl";
