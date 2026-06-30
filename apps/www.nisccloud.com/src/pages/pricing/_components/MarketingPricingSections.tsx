import { ServiceMockPricingSection } from "@/components/shadcn-space/blocks/pricing-01/service-mock-pricing.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";

type MockPricingProps = {
  serviceName: string;
  subtitle: string;
  plans: OrderPlan[];
};

function MockPricing({ serviceName, subtitle, plans }: MockPricingProps) {
  return (
    <ServiceMockPricingSection
      plans={plans}
      serviceName={serviceName}
      subtitle={subtitle}
      pricingNote={subtitle}
    />
  );
}

export function BrandIdentityPricing() {
  return (
    <MockPricing
      serviceName="Brand Identity & Logo Design"
      subtitle="One-time investment. You own all files forever. No annual fees."
      plans={[
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
      ]}
    />
  );
}

export function WebsiteDesignPricing() {
  return (
    <MockPricing
      serviceName="Website Design & Development"
      subtitle="Fixed project price. No hourly billing. No hidden costs."
      plans={[
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
            "Unlimited custom pages",
            "Custom UI/UX design in Figma",
            "CMS + multi-language support",
            "Full SEO audit + schema markup",
            "6-month priority support",
            "Delivered in 21 business days",
          ],
        },
      ]}
    />
  );
}

export function EcommercePricing() {
  return (
    <MockPricing
      serviceName="E-commerce Store Development"
      subtitle="One-time development fee. Hosting and payment gateway fees billed separately."
      plans={[
        {
          id: "ecom-launch",
          name: "Launch Store",
          price: 55000,
          period: "once",
          features: [
            "Up to 50 products",
            "M-Pesa STK Push integration",
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
            "Unlimited products + variants",
            "All payment methods included",
            "Abandoned cart recovery emails",
            "Multi-vendor marketplace option",
            "ERP / accounting integration",
            "30-day delivery + manager training",
          ],
        },
      ]}
    />
  );
}

export function SocialMediaPricing() {
  return (
    <MockPricing
      serviceName="Social Media Management"
      subtitle="Monthly retainer. Content approval included. Cancel with 30-day notice."
      plans={[
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
            "Unlimited posts + 8 videos/month",
            "Dedicated social media manager",
            "Influencer campaign management",
            "Paid social boosting strategy",
            "Weekly reporting & strategy calls",
          ],
        },
      ]}
    />
  );
}

export function PaidAdsPricing() {
  return (
    <MockPricing
      serviceName="Paid Advertising Management"
      subtitle="Management fee billed monthly. Ad spend billed directly by Google/Meta/TikTok."
      plans={[
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
            "Unlimited ad spend managed",
            "Full creative production (video + static)",
            "CRM integration & lead scoring",
            "Dedicated account strategist",
            "Weekly strategy sessions",
          ],
        },
      ]}
    />
  );
}

export function ZeepoAiPricing() {
  return (
    <MockPricing
      serviceName="AI Automation"
      subtitle="Monthly subscription. AI improves over time. No setup fee on 3-month commitment."
      plans={[
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
            "Unlimited conversations, all channels",
            "Custom AI trained on your business",
            "Full sales pipeline automation",
            "Voice AI phone call handling",
            "M-Pesa collection via WhatsApp",
            "Dedicated AI success manager",
          ],
        },
      ]}
    />
  );
}

export function CloudBundlesPricing() {
  return (
    <MockPricing
      serviceName="Cloud Plans"
      subtitle="Brand, hosting, and marketing bundled for Kenyan businesses that want everything managed."
      plans={[
        {
          id: "launchpad",
          name: "Launchpad",
          price: 25000,
          period: "month",
          features: [
            "Brand identity (logo + guidelines)",
            "Custom website (5 pages)",
            "Managed cloud hosting",
            "Free SSL + CDN",
            "Basic SEO setup",
            "Monthly report",
          ],
        },
        {
          id: "orbit",
          name: "Orbit",
          price: 65000,
          period: "month",
          features: [
            "Everything in Launchpad",
            "10-page website",
            "SEO + content strategy",
            "Google & Meta campaigns",
            "Social media (3 platforms)",
            "Email marketing + CRM",
          ],
        },
      ]}
    />
  );
}
