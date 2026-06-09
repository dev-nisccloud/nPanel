import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Globe, TrendingUp, Mail, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const tabs = [
  {
    id: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    image: "https://hercules-cdn.com/file_jLLWeWPpwCBV44YLcf6RS6wg",
    headline: "Your Business at a Glance",
    desc: "See domains, orders, invoices, subscriptions, website visitors and email campaign performance — all from one screen the moment you log in.",
    points: ["Domains & hosting status", "Orders & invoices summary", "Website traffic (30-day chart)", "Email campaign performance"],
    color: "oklch(0.55 0.18 195)",
  },
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    image: "https://hercules-cdn.com/file_0dKysquD3hsQyce6fCxGWSq4",
    headline: "Search & Register Your Domain",
    desc: "Find available .com, .co.ke, .net, .io and more. See live pricing in KSh, register instantly, and manage your entire portfolio from one place.",
    points: ["Live domain availability search", "KSh pricing with discounts", "Domain portfolio manager", "Transfer existing domains"],
    color: "oklch(0.50 0.20 265)",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    image: "https://hercules-cdn.com/file_Xlak0r0hue2UNA9W07ZSTkGa",
    headline: "Track Every Marketing Result",
    desc: "Monitor SEO rankings, Google Ads, Meta campaigns, and social media growth. See what's working and where to invest next — all in real time.",
    points: ["Social media analytics", "Ad spend & ROAS tracking", "SEO ranking movements", "Lead generation funnels"],
    color: "oklch(0.58 0.22 25)",
  },
  {
    id: "email",
    label: "Email & CRM",
    icon: Mail,
    image: "https://hercules-cdn.com/file_W78KZEqOP2TVuD53comVsMZG",
    headline: "Manage Clients & Campaigns",
    desc: "Run email campaigns, manage client accounts, track billing, and handle KRA eTIMS from a single unified panel — no extra tools needed.",
    points: ["Email marketing campaigns", "Client & billing management", "KRA eTIMS integration", "CRM & service orders"],
    color: "oklch(0.52 0.18 160)",
  },
];

const stats = [
  { value: "500+", label: "Businesses Powered" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "30 days", label: "First Results" },
  { value: "1 Login", label: "Everything Managed" },
];

export default function DashboardPreview() {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section className="py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.72 0.2 210 / 0.05), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            NPANEL — YOUR COMMAND CENTER
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
            One Dashboard to Run Your Entire Business
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            No more 5 logins and 5 vendor calls. nPanel gives you a single screen to manage your cloud, track marketing, handle billing, and stay in full control — 24/7.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-8 mb-10"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                active === t.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card border-border/60 text-muted-foreground hover:border-primary/40"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-5 gap-8 items-center"
          >
            {/* Screenshot — wider */}
            <div className="lg:col-span-3 relative">
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/60 border-b border-border/40">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">npanel.nisccloud.co.ke</span>
                </div>
                <img
                  src={current.image}
                  alt={`nPanel ${current.label} view`}
                  className="w-full block"
                />
              </div>
              {/* Live badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute -bottom-4 -right-3 bg-background border border-green-500/30 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-green-500" />
                <div>
                  <div className="text-xs font-bold">Live & Updated</div>
                  <div className="text-[10px] text-muted-foreground">Real-time data</div>
                </div>
              </motion.div>
            </div>

            {/* Text side */}
            <div className="lg:col-span-2 space-y-5 pb-6 lg:pb-0">
              <div
                className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest px-3 py-1.5 rounded-full border"
                style={{ color: current.color, borderColor: `${current.color}30`, backgroundColor: `${current.color}10` }}
              >
                <current.icon size={12} />
                {current.label.toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold leading-snug">{current.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
              <ul className="space-y-2.5">
                {current.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm">
                    <ChevronRight size={14} style={{ color: current.color }} className="shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button
                className="rounded-full px-6 h-10 font-bold gap-2 cursor-pointer mt-2"
                onClick={() => window.open("https://npanel.nisccloud.co.ke", "_blank")}
              >
                Explore nPanel
                <ArrowRight size={14} />
              </Button>
              <p className="text-xs text-muted-foreground">Free with every Nisc Cloud plan.</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
