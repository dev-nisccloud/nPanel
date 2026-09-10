import { countries } from "@npanel/location/countries-intl";

export function toAlpha2Country(country: string): string {
	const t = country.trim();
	if (!t) return "KE";
	if (t.length === 2) return t.toUpperCase();
	const hit = countries.find(
		(c) =>
			c.name.toLowerCase() === t.toLowerCase() ||
			c.alpha2.toLowerCase() === t.toLowerCase(),
	);
	return hit?.alpha2 ?? t.slice(0, 2).toUpperCase();
}

export function toE164Phone(phone: string, countryAlpha2?: string): string {
	const digits = phone.replace(/\D/g, "");
	if (!digits) return phone.trim();
	if (phone.trim().startsWith("+")) return `+${digits}`;
	if (countryAlpha2 === "KE" || digits.startsWith("254")) {
		if (digits.startsWith("254")) return `+${digits}`;
		if (digits.startsWith("0") && digits.length >= 9) return `+254${digits.slice(1)}`;
		if (digits.length >= 9) return `+254${digits}`;
	}
	return `+${digits}`;
}

export function splitOpenProviderPhone(phone: string): {
	country_code: string;
	area_code: string;
	subscriber_number: string;
} {
	const trimmed = phone.trim();
	const plusBody = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
	const tokens = plusBody.split(/\s+/).filter(Boolean);
	if (tokens.length >= 3 && /^\d{1,4}$/.test(tokens[0]!.replace(/^\+/, ""))) {
		return {
			country_code: `+${tokens[0]!.replace(/^\+/, "")}`,
			area_code: tokens[1]!,
			subscriber_number: tokens.slice(2).join(""),
		};
	}

	const digits = trimmed.replace(/\D/g, "");
	let countryCode = "254";
	let areaCode = "0";
	let subscriberNumber = "0000000";

	if (digits.startsWith("254") && digits.length > 3) {
		countryCode = "254";
		const national = digits.slice(3);
		areaCode = national.slice(0, 2);
		subscriberNumber = national.slice(2) || "0000000";
	} else if (digits.startsWith("1") && digits.length >= 10) {
		countryCode = "1";
		const national = digits.slice(1);
		areaCode = national.slice(0, 3);
		subscriberNumber = national.slice(3) || "0000000";
	} else if (digits.startsWith("0") && digits.length >= 9) {
		const national = digits.slice(1);
		areaCode = national.slice(0, 2);
		subscriberNumber = national.slice(2) || "0000000";
	} else if (digits.length >= 8) {
		countryCode = digits.slice(0, digits.length - 7);
		areaCode = digits.slice(countryCode.length, countryCode.length + 2);
		subscriberNumber = digits.slice(countryCode.length + 2) || "0000000";
	}

	return {
		country_code: `+${countryCode.replace(/^\+/, "")}`,
		area_code: areaCode,
		subscriber_number: subscriberNumber,
	};
}

export function splitStreetNumber(street: string, number?: string): { street: string; number: string } {
	const n = number?.trim();
	if (n) return { street: street.trim() || "N/A", number: n };
	const addressStr = street.trim();
	const leadingNumMatch = addressStr.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
	if (leadingNumMatch) {
		return { number: leadingNumMatch[1]!, street: leadingNumMatch[2]! };
	}
	return { street: addressStr || "N/A", number: "1" };
}

export function splitDomainNameExtension(domain: string, tld?: string): { name: string; extension: string } {
	const d = domain.trim().toLowerCase().replace(/\.$/, "");
	if (tld) {
		const ext = tld.replace(/^\./, "").toLowerCase();
		if (d.endsWith(`.${ext}`)) {
			return { name: d.slice(0, -(ext.length + 1)), extension: ext };
		}
	}
	const parts = d.split(".");
	return { name: parts[0] ?? d, extension: parts.slice(1).join(".") };
}
