export const REGISTRANT_PROFILE_FIELD_LABELS = {
	firstName: "First name",
	lastName: "Last name",
	address: "Street address",
	city: "City",
	country: "Country",
	postalCode: "Postal code",
	phone: "Phone number",
} as const;

export type RegistrantProfileFields = {
	firstName?: string | null;
	lastName?: string | null;
	address?: string | null;
	city?: string | null;
	country?: string | null;
	postalCode?: string | null;
	phone?: string | null;
};

export function getMissingRegistrantProfileFields(
	profile: RegistrantProfileFields | null | undefined,
): string[] {
	if (!profile) return Object.values(REGISTRANT_PROFILE_FIELD_LABELS);
	const missing: string[] = [];
	for (const key of Object.keys(REGISTRANT_PROFILE_FIELD_LABELS) as Array<
		keyof typeof REGISTRANT_PROFILE_FIELD_LABELS
	>) {
		const value = profile[key];
		if (!value || String(value).trim() === "") {
			missing.push(REGISTRANT_PROFILE_FIELD_LABELS[key]!);
		}
	}
	return missing;
}

export function isRegistrantProfileComplete(
	profile: RegistrantProfileFields | null | undefined,
): boolean {
	return getMissingRegistrantProfileFields(profile).length === 0;
}
