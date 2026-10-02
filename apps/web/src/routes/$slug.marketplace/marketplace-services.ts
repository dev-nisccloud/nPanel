/**
 * Marketplace service UI configuration.
 *
 * Product data (name, description, features/highlights) comes from the DB via
 * trpc.products.getAll. This file only holds UI-only concerns: how DB categories
 * map to human-readable section headings.
 */

/** DB product category → marketplace section label */
export const DB_CATEGORY_LABELS: Record<string, string> = {
  CLOUD:      "Hosting & Infrastructure",
  MARKETING:  "Marketing & Growth",
  AI:         "AI-Powered Tools",
  CONSULTING: "Consulting",
  CUSTOM:     "Custom Services",
};

/**
 * Converts a product name to a stable URL-safe slug.
 * "Website Hosting"   → "website-hosting"
 * "Creatives & Design" → "creatives-design"
 * "AI Image Generator" → "ai-image-generator"
 */
export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CustomerPlanService = "hosting" | "wordpress" | "email";

const PLAN_SERVICE_TERMS: Record<CustomerPlanService, string[]> = {
  hosting: ["website hosting", "web hosting"],
  wordpress: ["wordpress hosting", "wordpress managed", "managed wordpress"],
  email: ["email hosting", "business email", "professional email"],
};

/** Marketplace slug for the product that matches a customer service page. */
export function marketplaceSlugForService(
  products: { name: string }[],
  service: CustomerPlanService,
): string | null {
  const terms = PLAN_SERVICE_TERMS[service];
  const product = products.find((item) => {
    const name = item.name.toLowerCase();
    if (service === "hosting" && (name.includes("wordpress") || name.includes("email"))) return false;
    if (service === "email" && name.includes("marketing")) return false;
    return terms.some((term) => name.includes(term));
  });
  return product ? slugifyProductName(product.name) : null;
}
