import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Server, Zap, ShieldCheck, Globe } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features: ServiceFeature[] = [
  { icon: Zap, title: "Fast CDN Delivery", href: "/hosting", desc: "Content delivered from a global network so your site loads quickly for visitors wherever they are." },
  { icon: ShieldCheck, title: "Strong Security", href: "/security", desc: "WAF, DDoS protection, SSL, vulnerability scanning, and daily backups included as standard." },
  { icon: Server, title: "Auto-Scaling Infra", href: "/hosting/vps", desc: "Traffic spike? Our infrastructure scales to handle the load without unnecessary downtime." },
  { icon: Globe, title: "99.9% Uptime Target", desc: "We target 99.9% monthly uptime with continuous monitoring, incident response, and clear status updates." },
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
            <ShowcaseVisualCard visual="uptime" headline="Hosting built to stay online" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Reliable Cloud Hosting. <br />
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

        <ServiceFeatureGrid features={features} />
      </div>
    </section>
  );
}
