import flags from "./country-flags";
import { currencies } from "./currencies";
import { EU_COUNTRY_CODES } from "./eu-countries";
import timezones from "./timezones.json";
function header(headers, name, fallback) {
    if (!headers)
        return fallback;
    return headers.get(name) || fallback;
}
/**
 * Geo/locale hints from request headers (e.g. `x-vercel-ip-*` on Vercel).
 * Pass `request.headers` from your server (Hono, RR resource route, etc.).
 * In the browser, there are no geo headers   defaults apply.
 */
export function getCountryCodeSync(headers) {
    return header(headers, "x-vercel-ip-country", "SE");
}
export function getTimezoneSync(headers) {
    return header(headers, "x-vercel-ip-timezone", "Europe/Berlin");
}
export function getLocaleSync(headers) {
    return header(headers, "x-vercel-ip-locale", "en-US");
}
/** @deprecated Prefer `getCountryCodeSync(headers)` with request headers on the server. */
export async function getCountryCode(headers) {
    return getCountryCodeSync(headers);
}
/** @deprecated Prefer `getTimezoneSync(headers)`. */
export async function getTimezone(headers) {
    return getTimezoneSync(headers);
}
/** @deprecated Prefer `getLocaleSync(headers)`. */
export async function getLocale(headers) {
    return getLocaleSync(headers);
}
export function getTimezones() {
    return timezones;
}
export async function getCurrency(headers) {
    const countryCode = await getCountryCode(headers);
    return currencies[countryCode];
}
export async function getDateFormat(headers) {
    const country = await getCountryCode(headers);
    if (country === "US") {
        return "MM/dd/yyyy";
    }
    if (["CN", "JP", "KR", "TW"].includes(country)) {
        return "yyyy-MM-dd";
    }
    if (["AU", "NZ", "IN", "ZA", "BR", "AR"].includes(country)) {
        return "dd/MM/yyyy";
    }
    return "yyyy-MM-dd";
}
export async function isEU(headers) {
    const countryCode = await getCountryCode(headers);
    if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
        return true;
    }
    return false;
}
export async function getCountry(headers) {
    const country = await getCountryCode(headers);
    if (country && Object.prototype.hasOwnProperty.call(flags, country)) {
        return flags[country];
    }
    return undefined;
}
export { countries } from "./countries-intl";
