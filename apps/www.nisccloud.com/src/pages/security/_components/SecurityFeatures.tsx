import { motion } from "motion/react";
import { ShieldCheck, ScanLine, Flame, Activity, Lock, Database } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "SSL Certificate Included",
    desc: "Every plan includes a free SSL certificate with trust seal, SHA-2 and 2048-bit encryption, and improved Google search rankings.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Flame,
    title: "Firewall Helps Prevent Hackers",
    desc: "Our Web Application Firewall (WAF) protects against security threats, blocks malicious traffic, and prevents future attacks automatically.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: ScanLine,
    title: "Daily Malware Scanning",
    desc: "Your site is scanned up to 4 times daily. If malware is detected, you get instant alerts and our experts remove it fast.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Activity,
    title: "Continuous Site Monitoring",
    desc: "We monitor blacklist status, SEO spam injections, SSL changes, and website uptime - alerting you to threats immediately.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Lock,
    title: "DDoS Protection",
    desc: "Advanced DDoS mitigation absorbs and neutralises volumetric attacks, keeping your site online even under heavy attack traffic.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Database,
    title: "Secure Daily Backups",
    desc: "Encrypted off-site backups stored daily. If anything goes wrong, restore your site to a clean state in minutes - not hours.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function SecurityFeatures() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Included in Every Plan</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">Everything You Need to Stay Secure</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">A complete, proactive security system - protecting your site before, during, and after any attack.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all p-6"
            >
              <div className={`w-11 h-11 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
