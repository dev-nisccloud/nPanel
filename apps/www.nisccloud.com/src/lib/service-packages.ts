import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";

// Single source for fixed-price service packages, shared by each service page and /pricing.

export const BRAND_IDENTITY_PLANS: OrderPlan[] = [
  {
    id: "brand-starter",
    name: "Starter",
    price: 25000,
    period: "once",
    features: [
      "Custom logo design (3 concepts)",
      "Logo files in all formats (PNG, SVG, PDF)",
      "Colour palette + typography system",
      "Mini brand guide (5 pages)",
      "Business card design included",
      "Delivered in 5 business days",
    ],
  },
  {
    id: "brand-enterprise",
    name: "Enterprise",
    price: 120000,
    period: "once",
    features: [
      "Everything in Starter",
      "Full brand guidelines PDF (20+ pages)",
      "Competitor brand audit report",
      "Brand positioning strategy",
      "Social media profile kit",
      "30-day post-delivery support",
    ],
  },
];

export const WEBSITE_DESIGN_PLANS: OrderPlan[] = [
  {
    id: "web-essential",
    name: "Essential",
    price: 35000,
    period: "once",
    features: [
      "Up to 5 custom pages",
      "Mobile-responsive design",
      "Contact form + WhatsApp button",
      "On-page SEO + Google Analytics",
      "SSL certificate included",
      "Delivered in 10 business days",
    ],
  },
  {
    id: "web-enterprise",
    name: "Enterprise",
    price: 150000,
    period: "once",
    features: [
      "Custom pages scoped to your project",
      "Custom UI/UX design in Figma",
      "CMS + multi-language support",
      "Full SEO audit + schema markup",
      "6-month priority support",
      "Delivered in 21 business days",
    ],
  },
];

export const ECOMMERCE_PLANS: OrderPlan[] = [
  {
    id: "ecom-launch",
    name: "Launch Store",
    price: 55000,
    period: "once",
    features: [
      "Up to 50 products",
      "Mobile money and card checkout setup",
      "Card payment gateway",
      "Order management dashboard",
      "Mobile-responsive storefront",
      "Delivered in 14 business days",
    ],
  },
  {
    id: "ecom-enterprise",
    name: "Enterprise Store",
    price: 220000,
    period: "once",
    features: [
      "Full catalogue setup with product variants",
      "All payment methods included",
      "Abandoned cart recovery emails",
      "Multi-vendor marketplace option",
      "ERP / accounting integration",
      "30-day delivery + manager training",
    ],
  },
];

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
      "Ad budgets of any size managed",
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
      "5-day setup included",
    ],
  },
  {
    id: "ai-enterprise",
    name: "AI Enterprise",
    price: 70000,
    period: "month",
    features: [
      "High-volume conversations, all channels",
      "Custom AI trained on your business",
      "Full sales pipeline automation",
      "Voice AI phone call handling",
      "Payment collection via WhatsApp",
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
      "Issued in under 1 Hour",
      "Free Installation Support",
      "Padlock in Browser Address Bar",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "KES 500,000 Warranty",
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
      "Issued in under 3 Business Days",
      "Free Installation Support",
      "Company Name in Certificate Details",
      "Padlock in Browser Address Bar",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "KES 1,500,000 Warranty",
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
      "Issued in under 5 Business Days",
      "Free Installation Support",
      "Verified Company Details in Certificate",
      "Highest Trust Level Available",
      "Google SEO Support",
      "Broad Browser Compatibility",
      "KES 5,000,000 Warranty",
      "Ideal for E-Commerce and Fintech",
      "Ideal for Banks and Government Portals",
      "Dedicated Validation Support",
    ],
  },
];

export const SERVICE_PACKAGE_NOTES = {
  BRAND_IDENTITY: "One-time investment. You own all files forever. No annual fees.",
  WEBSITE_DESIGN: "Fixed project price. No hourly billing. No hidden costs.",
  ECOMMERCE: "One-time development fee. Hosting and payment gateway fees billed separately.",
  SOCIAL_MEDIA: "Monthly retainer. Content approval included. Cancel with 30-day notice.",
  PAID_ADS: "Management fee billed monthly. Ad spend billed directly by Google/Meta/TikTok.",
  ZEPO_AI: "Monthly subscription. No setup fee on 3-month commitment.",
  SSL: "Prices shown are per year, excluding VAT. Free installation included on all plans.",
} as const;
