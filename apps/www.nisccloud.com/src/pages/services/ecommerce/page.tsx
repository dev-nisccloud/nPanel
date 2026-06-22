import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { ShoppingCart, CreditCard, Package, Truck, BarChart2, Shield, Smartphone, Globe } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "M-Pesa Checkout",
    headline: "Payments your customers already trust",
    body: "M-Pesa is how Kenya buys online. We integrate directly with Safaricom's Daraja API - not a wrapper - so customers pay in one STK Push tap and you receive funds instantly.",
    bullets: [
      "STK Push - zero typing, just approve on your phone",
      "99.9% payment reliability via direct Daraja API",
      "Visa, Mastercard, and bank transfer also supported",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[#4CAF50] px-5 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">M-Pesa Checkout</span>
            <Smartphone size={16} className="text-white/80" />
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-green-600">KES 3,500</div>
              <div className="text-xs text-green-600 mt-0.5">STK Push Sent to 0712 *** ***</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px]">✓</span>
              </div>
              <span>Payment confirmed instantly · Ref: MP3XZ890</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">120+</div>
            <div className="text-[10px] text-muted-foreground">Stores launched</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">2.4×</div>
            <div className="text-[10px] text-muted-foreground">Revenue growth</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Sales Analytics",
    headline: "Your store's entire financial picture, live",
    body: "Know your best sellers, busiest hours, and highest-value customer segments at a glance. Our analytics dashboard surfaces the insights you need to stock smarter and market sharper.",
    bullets: [
      "Real-time revenue, orders, and cart abandonment rates",
      "Customer geography and repeat purchase tracking",
      "Best-selling product rankings updated every hour",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Store Performance</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[["Revenue","KES 142,500"],["Orders","89"],["Avg Order","KES 1,600"],["Cart Recovery","38%"]].map(([l,v]) => (
              <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                <div className="font-extrabold text-primary text-sm">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-12">
            {[40,60,45,70,65,80,95,88,72,90,85,100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%`, opacity: 0.3 + (i/12)*0.7 }} />
            ))}
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
      headline={<>Sell Online With<br /><span className="text-primary">M-Pesa Built Right In</span></>}
      subtext="Launch a fully-featured online store that accepts M-Pesa, Visa, and bank transfers - optimised for Kenyan shoppers on mobile. We build stores that process orders while you sleep."
      serviceType="marketing"
      checkoutServiceType="ecommerce"
      checkoutProductName="E-Commerce"
      trustStats={[
        { value: "120+", label: "Online Stores Launched" },
        { value: "M-Pesa", label: "Native Payment Integration" },
        { value: "2.4×", label: "Average Revenue Growth" },
        { value: "99.9%", label: "Uptime Guarantee" },
      ]}
      features={[
        {
          icon: <CreditCard size={20} />,
          title: "M-Pesa & Card Payments",
          desc: "Native M-Pesa STK Push integration via Daraja API plus Visa, Mastercard, and bank transfer - all payments settled directly to your account.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile Shopping Experience",
          desc: "Designed for M-Pesa on Safaricom. Fast checkout, thumb-friendly product browsing, and one-click M-Pesa payment confirmation on any phone.",
        },
        {
          icon: <ShoppingCart size={20} />,
          title: "Complete Store Management",
          desc: "Add products, manage inventory, set prices and discounts, create categories, and manage orders from a simple dashboard - no technical skills needed.",
        },
        {
          icon: <Package size={20} />,
          title: "Inventory & Stock Control",
          desc: "Real-time stock tracking, low-stock alerts, variant management (size, colour, weight), and bulk product import via CSV for large catalogues.",
        },
        {
          icon: <Truck size={20} />,
          title: "Delivery & Logistics Integration",
          desc: "Connect with Kenya's top couriers - G4S, Sendy, Fargo, and custom rates. Automated order confirmation SMS and delivery tracking for customers.",
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
          desc: "Every product page optimised for Google search with schema markup, fast load speeds, and SEO-friendly URLs that drive organic traffic to your store.",
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
            "M-Pesa STK Push integration",
            "Visa/Mastercard payment gateway",
            "Mobile-responsive storefront",
            "Order management dashboard",
            "Basic inventory tracking",
            "Customer accounts & history",
            "SMS order confirmations",
            "SSL + security setup",
            "14-day delivery",
          ],
        },
        {
          id: "ecom-growth-popular",
          name: "Growth Store",
          price: 120000,
          period: "once",
          features: [
            "Unlimited products",
            "All payment methods incl. bank transfer",
            "Advanced inventory + variants",
            "Coupon & discount system",
            "Abandoned cart recovery emails",
            "Delivery zones & courier integration",
            "Sales analytics dashboard",
            "Product reviews & ratings",
            "Wishlist & compare features",
            "On-page SEO for all products",
            "21-day delivery",
          ],
        },
        {
          id: "ecom-enterprise",
          name: "Enterprise Store",
          price: 220000,
          period: "once",
          features: [
            "Everything in Growth Store",
            "Multi-vendor marketplace option",
            "Subscription & recurring billing",
            "Custom loyalty points system",
            "Advanced reporting & forecasting",
            "ERP / Accounting integration",
            "Custom mobile app (PWA)",
            "Dedicated store manager training",
            "6-month priority support",
            "30-day delivery",
          ],
        },
      ]}
      addons={[
        { id: "ecom-mpesa-express", label: "M-Pesa Express Checkout Setup", price: 15000, period: "once" },
        { id: "ecom-maintenance", label: "Monthly Store Maintenance & Updates", price: 12000, period: "month" },
        { id: "ecom-productphotos", label: "Product Photography (30 SKUs)", price: 25000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Store Strategy", desc: "We review your products, competitors, and target customers to define the best store structure, payment flow, and delivery strategy for your business." },
        { num: "02", title: "Design & Build", desc: "Custom storefront design, product catalogue setup, payment gateway integration, and full checkout flow development and testing." },
        { num: "03", title: "Payments & Logistics", desc: "M-Pesa Daraja API integration, card payment gateway setup, SMS notifications, and courier rate configuration specific to your delivery zones." },
        { num: "04", title: "Launch & Train", desc: "We go live, submit to Google, and run a full training session covering how to add products, manage orders, process refunds, and grow your store." },
      ]}
      whyPoints={[
        { title: "M-Pesa Done Properly", desc: "Most developers use third-party M-Pesa wrappers that break. We integrate directly with Safaricom Daraja API for 99.9% payment reliability." },
        { title: "Built for Kenyan Shopping Behaviour", desc: "Kenyan customers expect M-Pesa, compare prices, and shop on mobile after 8pm. Our stores are optimised for this exact behaviour." },
        { title: "Inventory That Actually Works", desc: "Real-time stock updates prevent overselling. Automated low-stock alerts mean you never miss a restock before a big sales day." },
        { title: "Your Store, Your Money", desc: "All payments settle directly to your M-Pesa business account or bank. No middleman holding your revenue. Daily or weekly payouts." },
        { title: "Scales From 10 to 10,000 Products", desc: "Our architecture handles small boutiques and large distributors. Your store grows with you without needing a rebuild every 18 months." },
        { title: "Training & Ongoing Support", desc: "We don't just hand over the keys. Full training sessions, video walkthroughs, and a dedicated support channel ensure you succeed long-term." },
      ]}
      faqs={[
        { q: "How does M-Pesa payment integration work for my customers?", a: "When a customer checks out, they enter their M-Pesa number and receive an automatic STK Push prompt on their phone. They enter their M-Pesa PIN and payment is confirmed instantly - no lipa na M-Pesa number copying required." },
        { q: "How quickly are M-Pesa payments settled to my account?", a: "M-Pesa business payments settle to your Safaricom account in real-time. Card payments settle within 1-3 business days depending on your chosen payment gateway (Pesapal, Flutterwave, or DPO)." },
        { q: "Can I manage the store myself after launch?", a: "Yes. We build on platforms with user-friendly dashboards (WooCommerce or custom). We provide full training covering product management, order processing, and reporting." },
        { q: "What happens if I need to add more products later?", a: "All plans allow adding products after launch. We also provide a bulk import template so you can upload hundreds of products via CSV in minutes." },
        { q: "Can the store handle flash sales and high traffic?", a: "Yes. We deploy on cloud infrastructure with auto-scaling, CDN, and caching. Your store stays fast and available even during promotional spikes and Black Friday events." },
        { q: "Do you integrate with Jumia or other marketplaces?", a: "For Enterprise plans, we can build integrations with Jumia Seller API and other marketplaces so your inventory syncs across all sales channels from one dashboard." },
      ]}
      ctaHeadline="Start Selling Online - With M-Pesa - This Month"
      ctaSubtext="Kenya's e-commerce market is growing 30% year-on-year. Every month without an online store is revenue going to your competitors. Let's launch yours."
      pricingNote="One-time development fee. Hosting and payment gateway fees billed separately."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
