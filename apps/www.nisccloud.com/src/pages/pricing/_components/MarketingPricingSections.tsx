import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { ServiceMockPricingSection } from "@/components/shadcn-space/blocks/pricing-01/service-mock-pricing.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import {
  BRAND_IDENTITY_PLANS,
  ECOMMERCE_PLANS,
  PAID_ADS_PLANS,
  SERVICE_PACKAGE_NOTES,
  SOCIAL_MEDIA_PLANS,
  SSL_PLANS,
  WEBSITE_DESIGN_PLANS,
  ZEPO_AI_PLANS,
} from "@/lib/service-packages.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";

type MockPricingProps = {
  serviceName: string;
  note: string;
  plans: OrderPlan[];
};

function MockPricing({ serviceName, note, plans }: MockPricingProps) {
  return <ServiceMockPricingSection plans={plans} serviceName={serviceName} subtitle={note} pricingNote={note} />;
}

export function BrandIdentityPricing() {
  return <MockPricing serviceName="Brand Identity & Logo Design" note={SERVICE_PACKAGE_NOTES.BRAND_IDENTITY} plans={BRAND_IDENTITY_PLANS} />;
}

export function WebsiteDesignPricing() {
  return <MockPricing serviceName="Website Design & Development" note={SERVICE_PACKAGE_NOTES.WEBSITE_DESIGN} plans={WEBSITE_DESIGN_PLANS} />;
}

export function EcommercePricing() {
  return <MockPricing serviceName="E-commerce Store Development" note={SERVICE_PACKAGE_NOTES.ECOMMERCE} plans={ECOMMERCE_PLANS} />;
}

export function SocialMediaPricing() {
  return <MockPricing serviceName="Social Media Management" note={SERVICE_PACKAGE_NOTES.SOCIAL_MEDIA} plans={SOCIAL_MEDIA_PLANS} />;
}

export function PaidAdsPricing() {
  return <MockPricing serviceName="Paid Advertising Management" note={SERVICE_PACKAGE_NOTES.PAID_ADS} plans={PAID_ADS_PLANS} />;
}

export function ZepoAiPricing() {
  return <MockPricing serviceName="Zepo AI Automation" note={SERVICE_PACKAGE_NOTES.ZEPO_AI} plans={ZEPO_AI_PLANS} />;
}

/** SSL checkout lives on the product page; this shows the same catalogue prices and links there to order. */
export function SslPlanSummary() {
  const { currency, kesToCurrencyRate } = useCurrency();
  const displayPrice = (amount: number) =>
    kesToCurrencyRate == null
      ? "Updating…"
      : formatCurrency(
          convertKesForDisplay(amount, currency, kesToCurrencyRate),
          currency,
        );
  return (
    <div className="pt-8">
      <div className="grid gap-4 md:grid-cols-3">
        {SSL_PLANS.map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg text-foreground font-normal">{plan.name}</h3>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">{displayPrice(plan.price)}</span>
              <span className="text-sm text-muted-foreground">/{plan.period === "yr" ? "year" : plan.period}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/hosting/ssl#pricing"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-border px-5 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Choose {plan.name}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{SERVICE_PACKAGE_NOTES.SSL}</p>
    </div>
  );
}

type EnquiryPanelProps = {
  title: string;
  body: string;
  points: string[];
  serviceName: string;
  cta: string;
};

/** Qualified-enquiry block for products priced per scope rather than from a fixed catalogue. */
export function EnquiryPanel({ title, body, points, serviceName, cta }: EnquiryPanelProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-neutral-950 text-white">
      <div className="grid gap-8 p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-9">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Custom pricing</p>
          <h3 className="mt-2 type-h3">{title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">{body}</p>
          <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-3">
            {points.map((point) => (
              <li key={point} className="flex gap-2 text-white/85">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-orange" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          to={`/contact?service=launch&serviceName=${encodeURIComponent(serviceName)}`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

const AGENCY_SERVICES = [
  { label: "Website Development", body: "Client websites designed and built to a fixed project price.", href: "/pricing?product=website-design" },
  { label: "WordPress Hosting", body: "Managed hosting for client WordPress sites.", href: "/pricing?product=wordpress" },
  { label: "Domains", body: "Register and renew client domains from one account.", href: "/pricing?product=domains" },
  { label: "Business Email", body: "Professional mailboxes on each client's domain.", href: "/pricing?product=email" },
  { label: "VPS", body: "Dedicated resources for larger client applications.", href: "/pricing?product=vps" },
  { label: "SEO / AEO", body: "Search visibility work your clients can see reported.", href: "/pricing?product=seo" },
];

export function AgencyServicesPanel() {
  return (
    <div className="pt-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {AGENCY_SERVICES.map((service) => (
          <Link
            key={service.label}
            to={service.href}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <span className="flex items-center justify-between font-semibold text-foreground">
              {service.label}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
            </span>
            <span className="mt-1.5 text-sm text-muted-foreground">{service.body}</span>
          </Link>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Managing several clients? Each one can have its own workspace in nPanel.{" "}
        <Link to="/hosting/agency" className="font-semibold text-primary hover:underline">
          See agency hosting
        </Link>
      </p>
    </div>
  );
}
