import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/track.ts";
import {
  ArrowRight,
  Globe,
  HardDrive,
  LayoutTemplate,
  Lock,
  Mail,
  Server,
  ShoppingCart,
} from "lucide-react";

const products = [
  {
    icon: Globe,
    title: "Domains",
    desc: "Search, register or transfer your business name.",
    href: "/hosting/domains",
  },
  {
    icon: Server,
    title: "Website Hosting",
    desc: "Reliable hosting for business websites.",
    href: "/hosting/web-hosting",
  },
  {
    icon: LayoutTemplate,
    title: "WordPress Hosting",
    desc: "Hosting set up for WordPress sites.",
    href: "/hosting/wordpress",
  },
  {
    icon: Mail,
    title: "Business Email",
    desc: "Professional email on your own domain.",
    href: "/hosting/email",
  },
  {
    icon: HardDrive,
    title: "VPS & Cloud Servers",
    desc: "VPS, VDS and dedicated servers.",
    href: "/hosting/vps",
  },
  {
    icon: Lock,
    title: "SSL Certificates",
    desc: "Sectigo certificates for your website.",
    href: "/security/ssl",
  },
] as const;

/** Homepage self-service products: plans and live prices are on each product page. */
export default function CloudProducts() {
  return (
    <section
      id="cloud-products"
      aria-labelledby="cloud-products-heading"
      className="pt-4 pb-4 md:pt-6"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="type-label mb-2 flex items-center gap-2 text-sky-700 dark:text-primary">
              <ShoppingCart className="size-3.5" aria-hidden />
              Buy online today
            </p>
            <h2
              id="cloud-products-heading"
              className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
            >
              Cloud products, ready when you are.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Choose a plan, see the price and renewal terms, and check out
              online. Manage everything afterwards in nPanel.
            </p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-primary"
          >
            Compare all pricing
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ icon: Icon, title, desc, href }) => (
            <li key={title}>
              <Link
                to={href}
                onClick={() => trackEvent("product_click", { product: title, href, source: "homepage_products" })}
                className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {desc}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-primary">
                    See plans and prices
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
