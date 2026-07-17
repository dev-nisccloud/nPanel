import { motion } from "motion/react";
import { Globe, ShieldCheck, BarChart3, Bot, Search, Mail, Share2, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

const addons = [
  { icon: Globe, label: "Extra Web Pages", price: "$99/page", desc: "Add more pages to your website beyond plan limit." },
  { icon: Search, label: "Advanced SEO Audit", price: "$349 one-time", desc: "Full technical SEO audit with 90-day action plan." },
  { icon: Share2, label: "Extra Social Platform", price: "$199/mo", desc: "Add management for an additional social channel." },
  { icon: Mail, label: "Email List Migration", price: "$249 one-time", desc: "We migrate and clean your existing email list." },
  { icon: Bot, label: "AI Chatbot Add-on", price: "$299/mo", desc: "Custom-trained AI chatbot for your website." },
  { icon: BarChart3, label: "Analytics Dashboard", price: "$149/mo", desc: "Unified real-time KPI dashboard for all channels." },
  { icon: ShieldCheck, label: "Security Hardening", price: "$199 one-time", desc: "WAF config, vulnerability scan, and security report." },
  { icon: Layers, label: "Brand Refresh", price: "$799 one-time", desc: "Update your existing logo, colors, or typography system." },
];

export default function PricingAddons() {
  const navigate = useNavigate();

  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            ADD-ONS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Add What You Need
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Stack any of these on top of your base plan for a package that fits your business.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {addons.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 transition-all group cursor-default"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <a.icon size={15} className="text-primary" />
                </div>
                <span className="text-xs font-mono text-primary font-semibold whitespace-nowrap">
                  {a.price}
                </span>
              </div>
              <h4 className="font-semibold text-sm mb-1">{a.label}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
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
          <p className="text-sm text-muted-foreground mb-4">
            Need something not listed? We build fully custom packages too.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="text-sm text-primary underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer font-medium"
          >
            Request a custom quote →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
