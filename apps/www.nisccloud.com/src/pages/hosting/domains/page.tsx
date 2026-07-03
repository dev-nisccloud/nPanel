import { useState } from "react";
import { motion } from "motion/react";
import {
  Globe, Shield, RefreshCw, Lock, Award, Zap, MapPin, Search,
  ChevronDown, ArrowRight, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import DomainSearch from "@/pages/_components/DomainSearch.tsx";

// ─── Data ─────────────────────────────────────────────────────────────────────

const trustStats = [
  { value: "5,000+", label: "Domains Registered" },
  { value: "200+", label: "TLD Extensions" },
  { value: "KENIC", label: "Accredited Registrar" },
  { value: "< 3 min", label: "M-Pesa Activation" },
];

const features = [
  {
    icon: <Globe size={20} />,
    title: "KENIC-Accredited .co.ke Registrar",
    desc: "Officially accredited by KENIC. Your .co.ke, .or.ke, .ac.ke, and .go.ke domains are registered directly at the registry  no middlemen, no delays.",
  },
  {
    icon: <Search size={20} />,
    title: "Instant Search  200+ Extensions",
    desc: "Check availability across .co.ke, .com, .org, .net, .africa and 200+ more in seconds. Smart suggestions appear automatically when your first choice is taken.",
  },
  {
    icon: <Shield size={20} />,
    title: "Free WHOIS Privacy",
    desc: "Keep your personal details off the public WHOIS database. Privacy protection is included free on all eligible extensions  no extra charge.",
  },
  {
    icon: <RefreshCw size={20} />,
    title: "Auto-Renewal & Expiry Alerts",
    desc: "Email + SMS reminders at 90, 30, and 7 days before expiry. Enable auto-renewal and your domain is secured forever, automatically.",
  },
  {
    icon: <Lock size={20} />,
    title: "Domain Lock & Transfer Protection",
    desc: "Registrar Lock prevents unauthorised transfers. Pair with 2FA on your account for full domain security against hijacking attempts.",
  },
  {
    icon: <Award size={20} />,
    title: "Free DNS  Anycast Speed",
    desc: "Full DNS management: A, CNAME, MX, TXT, SRV records. DNS propagates globally in under 5 minutes via Anycast DNS. No zone file headaches.",
  },
  {
    icon: <Zap size={20} />,
    title: "M-Pesa Activation in 3 Minutes",
    desc: "Domains go live immediately upon M-Pesa confirmation  24/7 including public holidays. Your domain resolves before you leave the payment screen.",
  },
  {
    icon: <MapPin size={20} />,
    title: "Local Registrar for .go.ke & .ac.ke",
    desc: "We handle government and academic domain requirements. We manage all KENIC documentation and liaison on your behalf.",
  },
];

const process = [
  { num: "01", title: "Search Your Domain", desc: "Enter any name below and instantly check availability across .co.ke, .com, .org and 200+ extensions." },
  { num: "02", title: "Buy Now & Pay", desc: "Select your domain, choose a registration period (multi-year rates available), and pay via M-Pesa, card, or bank transfer." },
  { num: "03", title: "Instant Activation", desc: "Domain is registered immediately. Email + SMS confirmation with nameservers and DNS login arrives within minutes." },
  { num: "04", title: "Connect Your Site", desc: "Point DNS to your hosting, set up MX records for email, or connect to any website builder. We help for free." },
];

const whyPoints = [
  { title: "Official KENIC-Accredited Registrar Kenya", desc: "One of Kenya's few KENIC-accredited registrars. Your .co.ke is registered directly at the source  no third-party resellers." },
  { title: "KES Pricing  No USD Currency Shocks", desc: "All prices in Kenyan Shillings. Pay what you see  no conversion fees, no hidden renewal charges." },
  { title: "M-Pesa Domain Registration in 3 Minutes", desc: "The only Kenyan registrar where you can register a domain entirely via M-Pesa in under 3 minutes  24/7 including public holidays." },
  { title: "Expiry Protection & 30-Day Grace Period", desc: "Expired domains are held for 30 days before release. We exhaust every renewal attempt before any domain is lost." },
  { title: "Free DNS Hosting Included Forever", desc: "DNS hosting is included free with every domain  forever. No separate fees, no zone file complexity." },
  { title: "Free Transfer Support  Fast & Easy", desc: "Moving a domain from another registrar? Our team handles the entire process for free. Most transfers complete in 5–7 days." },
];

const faqs = [
  { q: "How do I register a .co.ke domain in Kenya?", a: "Search your domain below, add it to your cart, and pay via M-Pesa. It's active in under 3 minutes. Cost: KES 999/year." },
  { q: "What documents are needed for .co.ke registration?", a: "Most .co.ke domains require only a valid Kenyan contact. For .or.ke you need NGO/org registration proof. For .ac.ke you need evidence of an educational institution. We guide you through all requirements." },
  { q: "Can I transfer my domain to Nisc Cloud?", a: "Yes. We accept transfers from any ICANN-accredited registrar. For .co.ke domains we coordinate with KENIC directly. The process takes 5–7 days and we provide full transfer support at no charge." },
  { q: "What happens if my domain expires?", a: "You receive reminders at 90, 30, and 7 days before expiry. After expiry your domain enters a 30-day grace period where you can still renew at the standard rate." },
  { q: "Can I register a .go.ke domain for a government entity?", a: "Yes. Government entities can register .go.ke domains through us. The process requires documentation confirming government status  we liaise with KENIC on your behalf." },
  { q: "Is WHOIS privacy available for .co.ke domains?", a: "WHOIS privacy for .co.ke domains follows KENIC policy. We provide maximum available privacy protection for all extensions we support." },
];

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="border-y border-border/60 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {trustStats.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-extrabold text-primary tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Everything Included</span>
        <h2 className="text-3xl font-bold mt-2 mb-3">Built for Kenyan Businesses</h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">Every plan includes everything you need  no add-ons required for the essentials.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {f.icon}
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-muted/20 border-y border-border py-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">How It Works</span>
          <h2 className="text-3xl font-bold mt-2">From Search to Live in Minutes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {process.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              {i < process.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="bg-primary/5 border-y border-primary/10 py-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Why Nisc Cloud</span>
          <h2 className="text-3xl font-bold mt-2">Built for Kenya, Built Different</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {whyPoints.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-start gap-4 bg-card rounded-2xl border border-border p-5"
            >
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-10">
        <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">FAQ</span>
        <h2 className="text-3xl font-bold mt-2">Common Questions</h2>
      </div>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm cursor-pointer hover:text-primary transition-colors"
            >
              {faq.q}
              <ChevronDown
                size={15}
                className={cn("shrink-0 ml-4 text-muted-foreground transition-transform duration-200", open === i && "rotate-180")}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Tld Extensions showcase ──────────────────────────────────────────────────

const kenyanTlds = [
  { ext: ".co.ke", price: "999", note: "Most popular" },
  { ext: ".or.ke", price: "999", note: "Organisations" },
  { ext: ".ac.ke", price: "999", note: "Academic" },
  { ext: ".ke", price: "1,199", note: "Short & bold" },
];

const globalTlds = [
  { ext: ".com", price: "1,200" },
  { ext: ".org", price: "1,099" },
  { ext: ".net", price: "1,099" },
  { ext: ".africa", price: "1,500" },
  { ext: ".shop", price: "2,200" },
  { ext: ".online", price: "800" },
];

function ExtensionsSection() {
  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Domain Extensions</span>
        <h2 className="text-3xl font-bold mt-2 mb-3">Every Extension Your Brand Needs</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">Register local Kenyan extensions for local trust, global extensions to protect your brand internationally.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Kenyan */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🇰🇪</span>
            <h3 className="font-bold">Kenyan Extensions</h3>
          </div>
          <div className="space-y-3">
            {kenyanTlds.map(({ ext, price, note }) => (
              <div key={ext} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-foreground">{ext}</span>
                  {note && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{note}</span>}
                </div>
                <span className="font-bold text-primary text-sm">KES {price}<span className="text-muted-foreground font-normal text-xs">/yr</span></span>
              </div>
            ))}
          </div>
        </div>
        {/* Global */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-bold">Global Extensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {globalTlds.map(({ ext, price }) => (
              <div key={ext} className="flex items-center justify-between">
                <span className="font-mono font-bold text-foreground text-sm">{ext}</span>
                <span className="font-bold text-primary text-sm">KES {price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">+190 more extensions available. Search to see live pricing.</p>
        </div>
      </div>
      {/* Bundle callout */}
      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Package size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1">Bundle .co.ke + .com + .ke + .net  Best Value</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">Register all four extensions together and save. Protect your brand from copycats in Kenya and globally with one purchase. Search your name below to see the bundle price.</p>
        </div>
      </div>
    </section>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-10 pb-0">
      {/* bg glow  clipped inside its own layer so it never bleeds horizontally */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, color-mix(in srgb, var(--color-primary) 7%, transparent), transparent)",
        }}
      />

      {/* Headline block  constrained width */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-5 tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          KENIC-ACCREDITED DOMAIN REGISTRAR
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight mb-4 text-balance"
        >
          Register Your{" "}
          <span className="text-primary">.co.ke Domain</span>{" "}
          in Kenya Today
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed"
        >
          Kenya's KENIC-accredited registrar. Register .co.ke, .com, .org and 200+ extensions with instant M-Pesa activation. Domain live in under 3 minutes.
        </motion.p>

        {/* trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: <Shield size={12} />, text: "Free WHOIS Privacy" },
            { icon: <Zap size={12} />, text: "M-Pesa in 3 min" },
            { icon: <RefreshCw size={12} />, text: "Auto-Renewal" },
            { icon: <Award size={12} />, text: "Free DNS Hosting" },
          ].map(({ icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border/60 rounded-full px-3 py-1 bg-card/60">
              <span className="text-primary">{icon}</span>
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Domain search  full width, outside the constrained container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.22 }}
      >
        <DomainSearch />
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DomainsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <Hero />

      <TrustBar />

      <FeaturesSection />

      <ProcessSection />

      <ExtensionsSection />

      <WhySection />

      <FaqSection />

      {/* Final CTA */}
      <section className="relative py-24">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent)",
          }}
        />
        <div className="max-w-2xl mx-auto px-4 md:px-8 text-center relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Secure Your .co.ke Before{" "}
            <span className="text-primary">Someone Else Does</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Over 5,000 Kenyan businesses trust Nisc Cloud to protect their domain names. Search yours now  it takes 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground font-bold px-8 rounded-xl h-11 cursor-pointer hover:opacity-90"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Search Your Domain <ArrowRight size={15} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
