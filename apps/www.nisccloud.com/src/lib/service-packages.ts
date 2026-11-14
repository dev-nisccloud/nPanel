import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";

// Fixed-price plans for services sold from a catalogue.
// Website design, e-commerce, brand identity and custom software are quoted in project-packages.ts.

export const SOCIAL_MEDIA_PLANS: OrderPlan[] = [
  {
    id: "social-essential",
    name: "Brand Presence",
    price: 20000,
    period: "month",
    features: [
      "Facebook + Instagram management",
      "12 branded posts per month",
      "Monthly content calendar",
      "Community management",
      "Hashtag & reach strategy",
      "Monthly analytics report",
    ],
  },
  {
    id: "social-enterprise",
    name: "Market Authority",
    price: 75000,
    period: "month",
    features: [
      "All major platforms including TikTok",
      "Posts per your content calendar + 8 videos/month",
      "Dedicated social media manager",
      "Influencer campaign management",
      "Paid social boosting strategy",
      "Weekly reporting & strategy calls",
    ],
  },
];

export const PAID_ADS_PLANS: OrderPlan[] = [
  {
    id: "ads-starter",
    name: "Growth Starter",
    price: 30000,
    period: "month",
    features: [
      "1 ad platform (Google or Meta)",
      "Up to KES 50K ad spend managed",
      "Campaign setup + audience targeting",
      "Ad creative (2 designs/month)",
      "Monthly performance report",
      "Monthly strategy call",
    ],
  },
  {
    id: "ads-enterprise",
    name: "Market Leader",
    price: 120000,
    period: "month",
    features: [
      "Google + Meta + TikTok ads",
      "Ad-budget scope confirmed before launch",
      "Full creative production (video + static)",
      "CRM integration & lead scoring",
      "Dedicated account strategist",
      "Weekly strategy sessions",
    ],
  },
];

export const ZEPO_AI_PLANS: OrderPlan[] = [
  {
    id: "ai-starter",
    name: "AI Starter",
    price: 15000,
    period: "month",
    features: [
      "AI chatbot (website + WhatsApp)",
      "Up to 500 conversations/month",
      "Lead capture & qualification",
      "FAQ automation",
      "English + Swahili support",
      "Setup scope and schedule confirmed before activation",
    ],
  },
  {
    id: "ai-enterprise",
    name: "AI Enterprise",
    price: 70000,
    period: "month",
    features: [
      "Conversation volume scoped to your requirements",
      "Approved business context configured for Zepo",
      "Supported workflows agreed before activation",
      "Channel availability confirmed in your proposal",
      "Human review and escalation rules",
      "Dedicated AI success manager",
    ],
  },
];

export const SSL_PLANS: OrderPlan[] = [
  {
    id: "ssl-dv",
    name: "Domain Validation (DV)",
    price: 1500,
    period: "yr",
    features: [
      "Single Domain Protection",
      "256-Bit Encryption",
      "Issuance timing depends on completed validation",
      "Free Installation Support",
      "Padlock in Browser Address Bar",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "Certificate warranty confirmed for the selected product",
      "Ideal for Blogs and Brochure Sites",
    ],
  },
  {
    id: "ssl-ov-popular",
    name: "Organisation Validation (OV)",
    price: 3500,
    period: "yr",
    features: [
      "Single Domain Protection",
      "256-Bit Encryption",
      "Issuance timing depends on organisation validation",
      "Free Installation Support",
      "Company Name in Certificate Details",
      "Padlock in Browser Address Bar",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "Certificate warranty confirmed for the selected product",
      "Ideal for Business Websites",
      "Wildcard Option Available",
    ],
  },
  {
    id: "ssl-ev",
    name: "Extended Validation (EV)",
    price: 8000,
    period: "yr",
    features: [
      "Single Domain Protection",
      "256-Bit Encryption",
      "Issuance timing depends on extended validation",
      "Free Installation Support",
      "Verified Company Details in Certificate",
      "Highest Trust Level Available",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "Certificate warranty confirmed for the selected product",
      "Ideal for E-Commerce and Fintech",
      "Ideal for Banks and Government Portals",
      "Dedicated Validation Support",
    ],
  },
];

export const SERVICE_PACKAGE_NOTES = {
  BRAND_IDENTITY: "Quoted in a proposal. Paid 50% to start and 50% at launch. Approved deliverables transfer after the invoices are paid, subject to the proposal and third-party licence terms.",
  WEBSITE_DESIGN: "Quoted in a proposal. Paid 50% to start and 50% at launch. No hourly billing.",
  ECOMMERCE: "Quoted in a proposal. Paid 50% to start and 50% at launch. Hosting and payment gateway fees are separate.",
  SOCIAL_MEDIA: "Monthly retainer. Content approval included. Cancel with 30-day notice.",
  PAID_ADS: "Management fee billed monthly. Ad spend billed directly by Google/Meta/TikTok.",
  ZEPO_AI: "Monthly subscription. No setup fee on 3-month commitment.",
  SSL: "Prices shown are per year, excluding VAT. Free installation included on all plans.",
} as const;
