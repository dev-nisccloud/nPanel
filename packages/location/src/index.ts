import flags from "./country-flags";
import { currencies } from "./currencies";
import { EU_COUNTRY_CODES } from "./eu-countries";
import timezones from "./timezones.json";

function header(headers: Headers | undefined, name: string, fallback: string): string {
  if (!headers) return fallback;
  return headers.get(name) || fallback;
}

/**
 * Geo/locale hints from request headers (e.g. `x-vercel-ip-*` on Vercel).
 * Pass `request.headers` from your server (Hono, RR resource route, etc.).
 * In the browser, there are no geo headers — defaults apply.
 */
export function getCountryCodeSync(headers?: Headers): string {
  return header(headers, "x-vercel-ip-country", "SE");
}

export function getTimezoneSync(headers?: Headers): string {
  return header(headers, "x-vercel-ip-timezone", "Europe/Berlin");
}

export function getLocaleSync(headers?: Headers): string {
  return header(headers, "x-vercel-ip-locale", "en-US");
}

/** @deprecated Prefer `getCountryCodeSync(headers)` with request headers on the server. */
export async function getCountryCode(headers?: Headers) {
  return getCountryCodeSync(headers);
}

/** @deprecated Prefer `getTimezoneSync(headers)`. */
export async function getTimezone(headers?: Headers) {
  return getTimezoneSync(headers);
}

/** @deprecated Prefer `getLocaleSync(headers)`. */
export async function getLocale(headers?: Headers) {
  return getLocaleSync(headers);
}

export function getTimezones() {
  return timezones;
}

export async function getCurrency(headers?: Headers) {
  const countryCode = await getCountryCode(headers);
  return currencies[countryCode as keyof typeof currencies];
}

export async function getDateFormat(headers?: Headers) {
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

export async function isEU(headers?: Headers) {
  const countryCode = await getCountryCode(headers);

  if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
    return true;
  }

  return false;
}

export async function getCountry(headers?: Headers) {
  const country = await getCountryCode(headers);

  if (country && Object.prototype.hasOwnProperty.call(flags, country)) {
    return flags[country as keyof typeof flags];
  }

  return undefined;
}

export { countries } from "./countries-intl";
