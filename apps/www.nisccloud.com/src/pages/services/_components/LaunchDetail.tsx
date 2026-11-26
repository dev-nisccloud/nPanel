import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Server, Zap, ShieldCheck, Globe } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features: ServiceFeature[] = [
  { icon: Zap, title: "Delivery & Performance", href: "/hosting", desc: "Choose hosting and optional delivery services around the website, application and audiences you need to support." },
  { icon: ShieldCheck, title: "Security by Scope", href: "/security", desc: "SSL, backups, monitoring and additional controls depend on the selected product and agreed service scope." },
  { icon: Server, title: "Infrastructure Options", href: "/hosting/vps", desc: "Move from web hosting to virtual or dedicated resources when the workload requires a different environment." },
  { icon: Globe, title: "99.9% Uptime Target", desc: "We target 99.9% monthly uptime with continuous monitoring, incident response, and clear status updates." },
];

const included = [
  "Hosting matched to the workload",
  "SSL and DNS configuration",
  "Backup options by selected plan",
  "Security controls by service scope",
  "CDN options where required",
  "Connected management through nPanel",
];

export default function LaunchDetail() {
  return (
    <section id="run" className="py-24 bg-background">
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
            <h2 className="type-h2 mb-5">
              Run your services <br />
              <span className="text-primary">with clear control.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Keep domains, hosting, email, billing and support connected through nPanel. The selected plan defines the resources, controls and support responsibilities included.
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
