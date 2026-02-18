/**
 * Creative section titles for domain search categories.
 * Keys must match sectionId from getTldExtensionsByCategory (lowercase, no spaces/special chars).
 */
export const DOMAIN_SECTION_TITLES: Record<string, string> = {
	popular: "Names everyone knows",
	business: "Built for business",
	education: "Learn and grow online",
	international: "Go global",
	technology: "Tech-forward identities",
	socialpersonal: "Your name, your space",
	professionalservices: "Pro presence",
	mediaentertainment: "Lights, camera, domain",
	ecommerceshopping: "Sell with confidence",
	industrysector: "Industry-standard addresses",
	lifestylehobbies: "For the things you love",
	countrycodes: "Local roots, global reach",
};

/** Category name from getTldExtensionsByCategory to stable sectionId. */
export function categoryNameToSectionId(name: string): string {
	return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function getSectionTitle(sectionId: string): string {
	return DOMAIN_SECTION_TITLES[sectionId] ?? sectionId;
}
