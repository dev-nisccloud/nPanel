import type { ReactNode } from "react";
import Navbar from "@/pages/_components/Navbar.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { Link } from "react-router-dom";
import {
  Server,
  Zap,
  Cpu,
  Globe,
  Mail,
  Shield,
  ArrowRight,
  HardDrive,
  TrendingUp,
  Building2,
  Repeat,
  Search,
} from "lucide-react";
import { motion } from "motion/react";

type Category = { icon: ReactNode; title: string; desc: string; price: string; href: string };

const groups: { id: string; title: string; intro: string; cols: string; items: Category[] }[] = [
  {
    id: "websites",
    title: "Website hosting",
    intro: "Managed hosting for business websites, WordPress sites and agencies, with a 99.9% monthly uptime target.",
    cols: "lg:grid-cols-3",
    items: [
      { icon: <Server size={24} />, title: "Shared Hosting", desc: "Perfect for new websites. Fast, managed, and affordable.", price: "See plans and prices", href: "/hosting/shared" },
      { icon: <Zap size={24} />, title: "Managed WordPress Hosting", desc: "Optimised WordPress with 1-click install and auto-updates.", price: "See plans and prices", href: "/hosting/wordpress" },
      { icon: <Building2 size={24} />, title: "Agency Hosting", desc: "Hosting for agencies managing client websites and applications.", price: "New · Request a proposal", href: "/hosting/agency" },
    ],
  },
  {
    id: "servers",
    title: "Cloud & dedicated servers",
    intro: "Reserved compute for applications, high-traffic sites and workloads that need root access.",
    cols: "lg:grid-cols-3",
    items: [
      { icon: <Cpu size={24} />, title: "VPS Servers", desc: "Dedicated resources, full root access, scalable power.", price: "See plans and prices", href: "/hosting/vps" },
      { icon: <HardDrive size={24} />, title: "VDS Hosting", desc: "Virtual dedicated servers with reserved, isolated resources.", price: "Custom pricing", href: "/hosting/vds" },
      { icon: <TrendingUp size={24} />, title: "Dedicated Servers", desc: "Bare metal servers with IPMI access, allocated exclusively to you.", price: "Custom pricing", href: "/hosting/dedicated-servers" },
    ],
  },
  {
    id: "domains",
    title: "Domains, SSL & migration",
    intro: "Register .co.ke and global domains, secure them with SSL, and move existing sites across with a planned migration.",
    cols: "lg:grid-cols-3",
    items: [
      { icon: <Globe size={24} />, title: "Domain Registration", desc: "Clear naming for your brand. Search, buy, and go live quickly.", price: "Search to see price", href: "/hosting/domains" },
      { icon: <Shield size={24} />, title: "SSL Certificates", desc: "HTTPS security, browser trust, and a clear padlock for visitors.", price: "See plans and prices", href: "/hosting/ssl" },
      { icon: <Repeat size={24} />, title: "Transfer Hosting", desc: "Plan your website migration to Nisc Cloud.", price: "Request an assessment", href: "/hosting/transfer" },
    ],
  },
  {
    id: "email",
    title: "Business email & productivity",
    intro: "Professional email on your own domain, plus Microsoft 365 and Google Workspace for teams.",
    cols: "lg:grid-cols-4",
    items: [
      { icon: <Mail size={24} />, title: "Business Email", desc: "Professional email at your domain with 10GB+ storage.", price: "See plans and prices", href: "/hosting/email" },
      { icon: <Mail size={24} />, title: "Enterprise Hybrid Email", desc: "Google Workspace or Microsoft 365 alongside Nisc Mail on one corporate domain.", price: "New · Annual custom quotation", href: "/hosting/hybrid-email" },
      { icon: <Mail size={24} />, title: "Microsoft 365", desc: "Licences, business email and productivity tools through Nisc Cloud.", price: "Request a quotation", href: "/hosting/microsoft-365" },
      { icon: <Mail size={24} />, title: "Google Workspace", desc: "Business Gmail and collaboration for your team.", price: "Request a quotation", href: "/hosting/google-workspace" },
    ],
  },
];

export default function HostingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content">
      <section className="pt-32 pb-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Cloud products · Hosting, domains &amp; email
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance">
            Everything your website needs
            <br className="hidden sm:block" /> to go live and stay fast
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Domains, hosting, email, and SSL, all managed in one place. Fast for
            your visitors, wherever they are, with a 99.9% monthly uptime target
            on hosting plans and 24/7 support by ticket, email and chat.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/hosting/domains"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:w-auto"
            >
              <Search className="size-4" aria-hidden />
              Search for a Domain
            </Link>
            <Link
              to="/pricing"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            >
              Compare All Plans
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <nav aria-label="Hosting categories" className="mt-6 flex flex-wrap justify-center gap-2">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="rounded-full border border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {g.title}
              </a>
            ))}
          </nav>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-14 space-y-14 text-left">
          {groups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-24">
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <h2 id={`${g.id}-heading`} className="text-2xl font-bold tracking-tight md:text-3xl">{g.title}</h2>
                <p className="max-w-xl text-sm text-muted-foreground sm:text-right">{g.intro}</p>
              </div>
              <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${g.cols}`}>
                {g.items.map((cat, i) => (
                  <motion.div
                    key={cat.href}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={cat.href}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:hover:translate-y-0"
                    >
                      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        {cat.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{cat.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{cat.desc}</p>
                      <span className="mt-auto text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        {cat.price} <ArrowRight size={14} aria-hidden />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <ClosingCta
        eyebrow="Not sure where to start?"
        headline="Find the right hosting for your business"
        subtext="Compare every plan side by side, or tell us about your website and we will recommend the right setup before you pay."
        primary={{ label: "Compare All Plans", href: "/pricing" }}
        secondary={{ label: "Talk to Our Team", href: "/contact?serviceName=Cloud%20Hosting" }}
      />
      </main>
      <Footer />
    </div>
  );
}
