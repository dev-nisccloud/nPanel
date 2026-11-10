import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { ECOMMERCE_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { ShoppingCart, CreditCard, Package, Truck, BarChart2, Shield, Smartphone, Globe } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Easy Checkout",
    headline: "A store that makes buying simple",
    body: "We organise product discovery, basket decisions, checkout, and confirmation as one clear mobile journey. Payment and delivery options are configured around the providers available for your business and project scope.",
    bullets: [
      "Mobile-first product browsing and checkout",
      "Supported payment methods agreed before integration",
      "Order confirmation and delivery messaging configured in scope",
    ],
    mockupRight: true,
    visual: "payment",
  },
  {
    tag: "Sales Analytics",
    headline: "See what customers buy and where they stop",
    body: "Store reporting can bring orders, product performance, stock, and checkout behaviour into one operating view. Available metrics and refresh timing depend on the chosen platform, gateways, and tracking configuration.",
    bullets: [
      "Order and product reporting from the store platform",
      "Checkout events where consent and tracking allow",
      "Exportable data for stock and marketing reviews",
    ],
    mockupRight: false,
    visual: "reporting",
  },
];

export default function EcommercePage() {
  return (
    <ServicePageShell
      badge="E-commerce Store Development"
      headline={<>Sell Online With <br /><span className="text-primary">A Store That Makes Buying Easy</span></>}
      subtext="Build a mobile-friendly store around your catalogue, checkout, payment providers, and delivery workflow. Your team gets a clear place to manage products and orders after handover."
      serviceType="marketing"
      checkoutServiceType="ecommerce"
      checkoutProductName="E-Commerce"
      heroImage="https://storage.nisccloud.com/npanel-uploads/nisc-website/e%20commerce%20store%20development.png"
      heroImageStandalone
      trustStats={[
        { value: "Scoped", label: "Payment Setup" },
        { value: "Training", label: "Included at Handover" },
        { value: "Mobile", label: "Checkout Designed First" },
        { value: "Clear", label: "Order Operations" },
      ]}
      features={[
        {
          icon: <CreditCard size={20} />,
          title: "Payment Gateway Setup",
          desc: "We configure the card, bank, or mobile-money methods supported by your selected gateway and account. Provider approval, fees, settlement, and availability remain subject to that provider.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile Shopping Experience",
          desc: "Fast checkout, thumb-friendly product browsing, and a clear path from product page to payment confirmation on any phone.",
        },
        {
          icon: <ShoppingCart size={20} />,
          title: "Complete Store Management",
          desc: "Manage products, categories, prices, discounts, and orders from the selected store platform, with handover training for the workflows included in your plan.",
        },
        {
          icon: <Package size={20} />,
          title: "Inventory & Stock Control",
          desc: "Track stock, variants, and low-stock thresholds using the capabilities of the chosen platform. Bulk import can be configured for compatible catalogue data.",
        },
        {
          icon: <Truck size={20} />,
          title: "Delivery & Logistics Integration",
          desc: "Set delivery zones, rates, collection rules, or supported courier connections. Bespoke carrier APIs and tracking flows are assessed and quoted separately.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Sales Analytics Dashboard",
          desc: "Review store orders, product performance, and configured checkout events. The exact metrics and refresh timing depend on platform and tracking support.",
        },
        {
          icon: <Shield size={20} />,
          title: "Secure Payments",
          desc: "Checkout uses HTTPS and supported payment-provider flows so card details are handled according to the selected gateway's implementation. Fraud tools and compliance scope vary by provider.",
        },
        {
          icon: <Globe size={20} />,
          title: "SEO-Optimised Product Pages",
          desc: "Product templates can include clear URLs, metadata, and relevant product schema. Search visibility still depends on catalogue quality, competition, authority, and ongoing optimisation.",
        },
      ]}
      plans={ECOMMERCE_PLANS}
      addons={[
        { id: "ecom-mpesa-express", label: "Express Mobile Checkout Setup", price: 15000, period: "once" },
        { id: "ecom-maintenance", label: "Monthly Store Maintenance & Updates", price: 12000, period: "month" },
        { id: "ecom-productphotos", label: "Product Photography (30 SKUs)", price: 25000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Store Strategy", desc: "We review your catalogue, customer journey, operating team, target markets, and provider accounts to define the store structure and integration scope." },
        { num: "02", title: "Design & Build", desc: "We create the storefront, configure the agreed catalogue structure, and build the priority browse-to-checkout journeys." },
        { num: "03", title: "Payments & Delivery", desc: "Supported gateways, delivery rules, notifications, tax settings, and order states are configured and tested within the agreed scope." },
        { num: "04", title: "Launch & Train", desc: "After approval, we launch and train your team on products, orders, refunds, reporting, and the operational limits of each connected provider." },
      ]}
      whyPoints={[
        { title: "Operations Shape the Build", desc: "Catalogue ownership, fulfilment, returns, and reporting are discussed before platform choices are locked in.", visual: "mobile" },
        { title: "Designed Around Your Market", desc: "Currency, delivery expectations, product information, and payment preferences are scoped for the customers you plan to serve.", visual: "localMarket" },
        { title: "Stock Rules You Can Manage", desc: "Inventory behaviour is configured around variants, thresholds, and team workflows supported by your selected platform.", visual: "inventory" },
        { title: "Provider Terms Stay Visible", desc: "Gateway settlement, fees, verification, refunds, and disputes remain governed by your chosen provider rather than hidden behind a universal promise.", visual: "payment" },
        { title: "Room for Planned Growth", desc: "We discuss catalogue size, campaigns, integrations, and expected traffic so the proposed architecture fits today's scope and likely next steps.", visual: "growth" },
        { title: "Handover With Boundaries", desc: "Training covers the agreed store workflows. Maintenance, new integrations, and ongoing assistance follow the selected plan or a separate scope.", visual: "support" },
      ]}
      faqs={[
        { q: "How do payments work for my customers?", a: "Customers see the methods enabled for your store and approved by your selected gateway. The exact card, bank, or mobile-money flow, confirmation timing, fees, and availability depend on that provider and your merchant account." },
        { q: "How quickly are payments settled to my account?", a: "Settlement timing is set by your payment provider, merchant category, currency, and account status. We confirm the provider documentation during setup rather than promise a universal settlement window." },
        { q: "Can I manage the store myself after launch?", a: "Yes. We build on platforms with user-friendly dashboards. We provide full training covering product management, order processing, and reporting." },
        { q: "What happens if I need to add more products later?", a: "You can add products after launch within the platform's limits. For large updates, we can prepare a compatible import template or quote catalogue assistance after reviewing your data." },
        { q: "Can the store handle flash sales and high traffic?", a: "Capacity depends on the selected platform, hosting resources, catalogue, extensions, and expected peak. Tell us about planned promotions during discovery so we can recommend caching, infrastructure, and load testing appropriate to the risk." },
        { q: "Do you integrate with Jumia or other marketplaces?", a: "Marketplace integration is assessed case by case. It requires a suitable seller account, an available and permitted API, compatible catalogue data, and a separately confirmed Enterprise scope." },
      ]}
      ctaHeadline="Plan a Store Your Team Can Operate"
      ctaSubtext="Bring your catalogue, preferred payment providers, and delivery workflow. We will map the build, integration scope, and handover before implementation starts."
      pricingNote={SERVICE_PACKAGE_NOTES.ECOMMERCE}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
