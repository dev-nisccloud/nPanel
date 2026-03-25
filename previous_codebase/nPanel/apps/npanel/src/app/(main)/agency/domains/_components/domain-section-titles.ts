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

/**
 * Tooltip descriptions for domain category tabs. Shown on hover to explain what each category is about.
 */
export const DOMAIN_SECTION_TOOLTIPS: Record<string, string> = {
	popular:
		"Widely recognized TLDs like .com, .net, .org and .io. Best for maximum credibility and memorability.",
	kenyan:
		"Kenyan domains (.ke, .co.ke and related). Ideal for local presence and Kenya-focused brands.",
	business:
		"TLDs tailored for companies and professional use. Strengthen your business identity online.",
	education:
		"Extensions suited for schools, universities and learning platforms. Build trust in education.",
	international:
		"Global-facing TLDs for brands that operate or appeal across multiple regions.",
	technology:
		"Tech-oriented extensions for apps, dev tools and digital products. Modern and industry-aligned.",
	socialpersonal:
		"Domains for personal sites, portfolios, blogs and social presence. Your name, your space.",
	professionalservices:
		"TLDs that signal expertise and professionalism. Suited for consultants and service providers.",
	mediaentertainment:
		"Extensions for content, streaming, events and creative projects. Stand out in media.",
	ecommerceshopping:
		"TLDs that support online stores and shopping. Build trust and clarity for e-commerce.",
	industrysector:
		"Industry-specific extensions that match your sector. Clear and relevant to your audience.",
	lifestylehobbies:
		"Domains for hobbies, lifestyle brands and community sites. Personal and memorable.",
	countrycodes:
		"Country-code TLDs for local targeting and regional identity. Local roots, global reach.",
};

/** Category name from getTldExtensionsByCategory to stable sectionId. */
export function categoryNameToSectionId(name: string): string {
	return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function getSectionTitle(sectionId: string): string {
	return DOMAIN_SECTION_TITLES[sectionId] ?? sectionId;
}

export function getSectionTooltip(sectionId: string): string {
	return DOMAIN_SECTION_TOOLTIPS[sectionId] ?? "";
}
