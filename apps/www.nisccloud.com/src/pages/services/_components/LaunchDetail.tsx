import { motion } from "motion/react";
import { Check, Server, Zap, ShieldCheck, Globe } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features = [
  { icon: Zap, title: "Fast CDN Delivery", desc: "Content delivered from a global network so your site loads quickly for visitors wherever they are." },
  { icon: ShieldCheck, title: "Strong Security", desc: "WAF, DDoS protection, SSL, vulnerability scanning, and daily backups included as standard." },
  { icon: Server, title: "Auto-Scaling Infra", desc: "Traffic spike? Our infrastructure scales to handle the load without unnecessary downtime." },
  { icon: Globe, title: "99.99% Uptime", desc: "We aim for 99.99% uptime with 24/7 monitoring, incident response, and clear status updates." },
];

const included = [
  "Managed cloud hosting",
  "Free SSL certificate",
  "Daily automated backups",
  "DDoS protection included",
  "Global CDN delivery",
  "Free setup help",
];

export default function LaunchDetail() {
  return (
    <section id="launch" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <ShowcaseVisualCard visual="uptime" headline="99.99% uptime hosting" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Reliable Cloud Hosting.<br />
              <span className="text-primary">Simple to Launch.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              We host your site on solid cloud infrastructure and help you get online without the technical stress. From domain to deployment, we handle the setup so you can focus on your customers.
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border/60 rounded-xl p-5 transition-all hover:border-primary/40"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                <f.icon size={16} />
              </div>
              <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
