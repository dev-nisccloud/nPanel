import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { ShoppingCart, CreditCard, Package, Truck, BarChart2, Shield, Smartphone, Globe, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Easy Checkout",
    headline: "A store that makes buying simple",
    body: "We build online stores that are clear on mobile, easy to browse, and fast to check out. Customers can find products, pay securely, and get order updates without confusion.",
    bullets: [
      "Mobile-first product browsing and checkout",
      "Secure payments including cards and mobile money options",
      "Clear order confirmation and delivery updates",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">Checkout Flow</span>
            <Smartphone size={16} className="text-white/80" />
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-primary">3 steps</div>
              <div className="text-xs text-muted-foreground mt-0.5">Cart · Pay · Confirm</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-[10px]">✓</span>
              </div>
              <span>Order confirmed · Customer notified</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">100+</div>
            <div className="text-[10px] text-muted-foreground">Clients helped</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">99.99%</div>
            <div className="text-[10px] text-muted-foreground">Uptime target</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Sales Analytics",
    headline: "Your store's numbers, clear and live",
    body: "Know your best sellers, busiest hours, and where customers drop off. Our analytics dashboard surfaces the insights you need to stock smarter and market better.",
    bullets: [
      "Real-time revenue, orders, and cart abandonment rates",
      "Customer geography and repeat purchase tracking",
      "Best-selling product rankings updated regularly",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Store Performance</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[["Revenue","Tracked"],["Orders","Live"],["Avg Order","Clear"],["Cart Recovery","Ready"]].map(([l,v]) => (
              <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                <div className="font-extrabold text-primary text-sm">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 size={14} className="text-primary shrink-0" />
            <span className="text-muted-foreground">Clear reporting included</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function EcommercePage() {
  return (
    <ServicePageShell
      badge="E-commerce Store Development"
      headline={<>Sell Online With<br /><span className="text-primary">A Store That Makes Buying Easy</span></>}
      subtext="Launch a fully featured online store built for mobile shoppers. Clear product pages, simple checkout, secure payments, and order management that works while you sleep."
      serviceType="marketing"
      checkoutServiceType="ecommerce"
      checkoutProductName="E-Commerce"
      heroImage="https://storage.nisccloud.com/npanel-uploads/nisc-website/e%20commerce%20store%20development.png"
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "Free", label: "Setup Help Included" },
        { value: "99.99%", label: "Uptime Target" },
      ]}
      features={[
        {
          icon: <CreditCard size={20} />,
          title: "Secure Payment Options",
          desc: "Accept cards, bank transfer, and mobile money options so customers can pay the way they prefer, with funds settling to your account.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile Shopping Experience",
          desc: "Fast checkout, thumb-friendly product browsing, and a clear path from product page to payment confirmation on any phone.",
        },
        {
          icon: <ShoppingCart size={20} />,
          title: "Complete Store Management",
          desc: "Add products, manage inventory, set prices and discounts, create categories, and manage orders from a simple dashboard. No technical skills needed.",
        },
        {
          icon: <Package size={20} />,
          title: "Inventory & Stock Control",
          desc: "Real-time stock tracking, low-stock alerts, variant management (size, colour, weight), and bulk product import via CSV for large catalogues.",
        },
        {
          icon: <Truck size={20} />,
          title: "Delivery & Logistics Integration",
          desc: "Connect with popular couriers and custom rates. Automated order confirmation and delivery tracking help customers stay informed.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Sales Analytics Dashboard",
          desc: "Real-time revenue reports, best-selling products, customer geography, cart abandonment rates, and conversion funnels to grow your store intelligently.",
        },
        {
          icon: <Shield size={20} />,
          title: "PCI-Compliant Security",
          desc: "SSL encryption, PCI-DSS compliant payment processing, fraud detection, secure customer data storage, and automatic security updates.",
        },
        {
          icon: <Globe size={20} />,
          title: "SEO-Optimised Product Pages",
          desc: "Every product page set up for search with schema markup, fast load speeds, and clear URLs that help people find your products.",
        },
      ]}
      plans={[
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
            "Unlimited products + variants",
            "All payment methods included",
            "Abandoned cart recovery emails",
            "Multi-vendor marketplace option",
            "ERP / accounting integration",
            "30-day delivery + manager training",
          ],
        },
      ]}
      addons={[
        { id: "ecom-mpesa-express", label: "Express Mobile Checkout Setup", price: 15000, period: "once" },
        { id: "ecom-maintenance", label: "Monthly Store Maintenance & Updates", price: 12000, period: "month" },
        { id: "ecom-productphotos", label: "Product Photography (30 SKUs)", price: 25000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Store Strategy", desc: "We review your products, competitors, and target customers to define the best store structure, payment flow, and delivery strategy for your business." },
        { num: "02", title: "Design & Build", desc: "Custom storefront design, product catalogue setup, payment gateway integration, and full checkout flow development and testing." },
        { num: "03", title: "Payments & Logistics", desc: "Payment setup, SMS notifications, and courier rate configuration specific to your delivery zones." },
        { num: "04", title: "Launch & Train", desc: "We go live, submit to Google, and run a training session covering how to add products, manage orders, process refunds, and grow your store." },
      ]}
      whyPoints={[
        { title: "Checkout Built for Real Shoppers", desc: "We design product pages and checkout flows that feel simple on mobile, so customers finish buying without friction.", visual: "mobile" },
        { title: "Built for Local Shopping Habits", desc: "Customers compare prices, shop on mobile, and expect clear delivery info. Our stores are built around that behaviour.", visual: "localMarket" },
        { title: "Inventory That Actually Works", desc: "Real-time stock updates help prevent overselling. Automated low-stock alerts mean you can restock before a busy sales day.", visual: "inventory" },
        { title: "Your Store, Your Money", desc: "Payments settle to your business account. No middleman holding your revenue longer than the payment provider requires.", visual: "payment" },
        { title: "Scales From Small to Large Catalogues", desc: "Our architecture handles small boutiques and large distributors. Your store can grow without needing a rebuild every 18 months.", visual: "growth" },
        { title: "Training & Ongoing Support", desc: "We do not just hand over the keys. Full training, walkthroughs, and 24/7 support help you succeed long-term.", visual: "support" },
      ]}
      faqs={[
        { q: "How do payments work for my customers?", a: "At checkout, customers choose a payment method they prefer. Mobile money customers can approve payment on their phone. Card customers pay through a secure gateway. Confirmation is shown right away." },
        { q: "How quickly are payments settled to my account?", a: "Mobile money business payments typically settle quickly to your account. Card payments usually settle within 1 to 3 business days depending on your chosen payment gateway." },
        { q: "Can I manage the store myself after launch?", a: "Yes. We build on platforms with user-friendly dashboards. We provide full training covering product management, order processing, and reporting." },
        { q: "What happens if I need to add more products later?", a: "All plans allow adding products after launch. We also provide a bulk import template so you can upload many products via CSV in minutes." },
        { q: "Can the store handle flash sales and high traffic?", a: "Yes. We deploy on cloud infrastructure with auto-scaling, CDN, and caching. Your store stays fast and available even during busy promotional periods." },
        { q: "Do you integrate with Jumia or other marketplaces?", a: "For Enterprise plans, we can build integrations with marketplace seller APIs so your inventory syncs across sales channels from one dashboard." },
      ]}
      ctaHeadline="Start Selling Online This Month"
      ctaSubtext="A clear, mobile-friendly store helps customers buy with confidence. Free setup help is included, and we train your team before launch."
      pricingNote="One-time development fee. Hosting and payment gateway fees billed separately."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
