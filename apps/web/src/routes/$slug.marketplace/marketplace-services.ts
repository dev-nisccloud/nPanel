/**
 * Marketplace service cards configuration.
 * Add or edit entries here to control what appears on the marketplace grid.
 * slug: used in URL e.g. /marketplace/website-hosting and for API product/plan lookup.
 * searchTerms: optional; if omitted, the API derives terms from slug (e.g. website-hosting → "website hosting", "web hosting").
 */

export interface MarketplaceServiceItem {
  slug: string;
  badgeText: string;
  title: string;
  description: string;
  /** Image URL or path. Use placeholder or asset path. */
  image: string;
}

/** Optional: explicit search terms for product name matching in DB. When not set, API uses slug-based defaults. */
export interface MarketplaceServiceItemWithSearch extends MarketplaceServiceItem {
  searchTerms?: string[];
}

/** Constant promo card (first card, no "Explore offer" button). Full-cover background image with centered title and description. */
export const MARKETPLACE_PROMO = {
  title: "It's the giant Nisc Cloud sale - make your next move!",
  description:
    "You'll love these great deals that were handpicked just for you.",
  /** Full-cover background image for the promo card (public/marketplace_common.png). */
  image: "/marketplace_common.png",
} as const;

/** Image base path for marketplace cards (public/marketplace folder). */
export const MARKETPLACE_IMAGES_BASE = "/marketplace";

/** List of marketplace service cards (badge, title, description, image, slug). */
export const MARKETPLACE_SERVICES: MarketplaceServiceItemWithSearch[] = [
  {
    slug: "business-email",
    badgeText: "Save up to 87%",
    title: "Business Email",
    description:
      "Build your brand with a professional email address, like you@yourdomain.com.",
    image: `${MARKETPLACE_IMAGES_BASE}/business_email.jpg`,
    searchTerms: ["business email", "email hosting", "professional email"],
  },
  {
    slug: "email-marketing",
    badgeText: "Active",
    title: "Email Marketing",
    description:
      "Create inbox-ready newsletters with an AI-powered email marketing tool.",
    image: `${MARKETPLACE_IMAGES_BASE}/email_marketing.jpg`,
    searchTerms: ["email marketing", "newsletter", "email campaigns"],
  },
  {
    slug: "website-hosting",
    badgeText: "Save up to 80%",
    title: "Website Hosting",
    description:
      "Get your website online with secure, speedy, and reliable hosting.",
    image: `${MARKETPLACE_IMAGES_BASE}/web_hosting.jpg`,
    searchTerms: ["website hosting", "web hosting", "web host"],
  },
  {
    slug: "vps-hosting",
    badgeText: "Save up to 71%",
    title: "VPS Hosting",
    description:
      "Get 20x more resources than traditional web hosting for large-scale sites.",
    image: `${MARKETPLACE_IMAGES_BASE}/vps_hosting.jpg`,
    searchTerms: ["vps hosting", "vps", "virtual private server"],
  },
  {
    slug: "background-remover",
    badgeText: "AI",
    title: "Background Remover",
    description:
      "Remove image backgrounds instantly with AI-powered one-click tool.",
    image: `${MARKETPLACE_IMAGES_BASE}/background_remover.jpg`,
    searchTerms: ["background remover", "background removal", "bg remove"],
  },
  {
    slug: "ai-image-generator",
    badgeText: "AI",
    title: "AI Image Generator",
    description:
      "Generate unique images from text with advanced AI image models.",
    image: `${MARKETPLACE_IMAGES_BASE}/ai_image_generator.jpg`,
    searchTerms: ["ai image", "image generator", "ai image generator"],
  },
  {
    slug: "creatives-design",
    badgeText: "Save up to 50%",
    title: "Creatives & Design",
    description:
      "Built for teams to efficiently manage creative assets and design workflows.",
    image: `${MARKETPLACE_IMAGES_BASE}/creatives_design.jpg`,
    searchTerms: ["creatives", "design", "creative assets", "creatives & design"],
  },
  {
    slug: "seo",
    badgeText: "Popular",
    title: "SEO",
    description:
      "Improve visibility and rankings with expert SEO tools and reports.",
    image: `${MARKETPLACE_IMAGES_BASE}/seo.jpg`,
    searchTerms: ["seo", "search engine", "search engine optimization"],
  },
  {
    slug: "media-buying",
    badgeText: "Save up to 75%",
    title: "Media Buying",
    description:
      "Run and optimize ad campaigns on Meta, Google, and LinkedIn from one place.",
    image: `${MARKETPLACE_IMAGES_BASE}/media_buying.jpg`,
    searchTerms: ["media buying", "ad campaigns", "ads", "meta ads", "google ads"],
  },
];
