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
