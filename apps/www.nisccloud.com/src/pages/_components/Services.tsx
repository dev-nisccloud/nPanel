import { motion } from "motion/react";
import {
  Globe,
  Server,
  TrendingUp,
  Mail,
  Search,
  Share2,
  Workflow,
  ShieldCheck,
  ArrowRight,
  Bot,
  Megaphone,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const services = [
  {
    icon: Globe,
    title: "Brand & Web Design",
    desc: "Custom websites, logos, and complete brand identity built for conversion and memorability.",
    tag: "Create",
  },
  {
    icon: Store,
    title: "E-commerce Store",
    desc: "Full online store with payments, inventory management, and mobile-first checkout experience.",
    tag: "Create",
  },
  {
    icon: Server,
    title: "Cloud Hosting",
    desc: "Enterprise-grade infrastructure with auto-scaling, CDN, DDoS protection, and 99.9% SLA uptime.",
    tag: "Host",
  },
  {
    icon: ShieldCheck,
    title: "Domains & Email",
    desc: "Professional domain and business email @yourdomain.co.ke. SSL, daily backups, and security included.",
    tag: "Host",
  },
  {
    icon: Search,
    title: "SEO / AEO / GEO",
    desc: "Rank #1 on Google, AI search engines, and Google Maps. Technical SEO, content strategy, and local ranking.",
    tag: "Market",
  },
  {
    icon: Megaphone,
    title: "Paid Advertising",
    desc: "Google, Meta, and TikTok ad campaigns optimized for ROAS. Performance-based pricing — we win when you win.",
    tag: "Market",
  },
  {
    icon: Share2,
    title: "Social Media",
    desc: "End-to-end social management — strategy, content creation, scheduling, community, and analytics.",
    tag: "Market",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    desc: "Automated drip sequences, newsletters, and transactional emails with segmentation and A/B testing.",
    tag: "Market",
  },
  {
    icon: TrendingUp,
    title: "Lead Generation",
    desc: "Funnels, landing pages, and lead capture systems designed to turn browsers into qualified buyers.",
    tag: "Market",
  },
  {
    icon: Bot,
    title: "Zeepo AI Content",
    desc: "AI-generated blog posts, social captions, ad copy, and email sequences — on demand, on brand.",
    tag: "Zeepo AI",
  },
  {
    icon: Workflow,
    title: "Marketing Automation",
    desc: "CRM workflows, lead scoring, chatbot flows, and AI-powered nurture sequences — your business on autopilot.",
    tag: "Zeepo AI",
  },
];

const tagColor: Record<string, string> = {
  Create: "oklch(0.60 0.22 235)",
  Host: "oklch(0.55 0.18 195)",
  Market: "oklch(0.50 0.20 265)",
  "Zeepo AI": "oklch(0.45 0.18 160)",
};

export default function Services() {
  const navigate = useNavigate();
  return (
    <section id="services" className="py-14 relative">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(oklch(0.72 0.2 210) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            WHAT WE DO
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Every Service. One Team.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            All the tools your Kenyan business needs to grow — packaged as one integrated ecosystem.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all duration-300 cursor-default"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `${tagColor[s.tag]}18`,
                  color: tagColor[s.tag],
                }}
              >
                <s.icon size={18} />
              </div>
              <span
                className="text-[10px] font-mono font-bold tracking-widest mb-2 block"
                style={{ color: tagColor[s.tag] }}
              >
                {s.tag.toUpperCase()}
              </span>
              <h3 className="font-semibold text-base mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Button
            size="lg"
            onClick={() => navigate("/pricing")}
            className="bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold gap-2"
          >
            See Pricing <ArrowRight size={16} />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
