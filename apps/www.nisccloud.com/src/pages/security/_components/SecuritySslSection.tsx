import { motion } from "motion/react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const sslOptions = [
  {
    type: "I'll do it myself",
    name: "SSL Certificates",
    desc: "Self-install your SSL certificate, set up redirects, fix mixed content errors, and manage your own maintenance and updates.",
    points: [
      "Available in DV, OV and EV SSL certificates",
      "Protect one site, multiple sites or subdomains",
      "1-year validity period - longer terms available",
      "Full management and control",
    ],
    from: 999,
    period: "yr",
    href: "/contact",
    cta: "Get SSL Certificate",
    muted: true,
  },
  {
    type: "We'll do it for you",
    name: "Managed SSL Service",
    desc: "Our Nisc Cloud experts handle the installation, maintenance and updates for you - so you can focus on running your business.",
    points: [
      "Includes one DV SSL certificate",
      "Protect one site, multiple sites or subdomains",
      "Terms up to 5 years available",
      "Hands-off - we handle everything",
    ],
    from: 2000,
    period: "yr",
    href: "/contact",
    cta: "Get Managed SSL",
    muted: false,
  },
];

export default function SecuritySslSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 border-y border-primary/10" style={{ background: "linear-gradient(160deg, oklch(0.96 0.04 235 / 0.50) 0%, oklch(0.94 0.06 265 / 0.35) 50%, oklch(0.95 0.05 195 / 0.40) 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">SSL Solutions</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">We Offer Both Self-Managed &amp; Fully Managed SSL</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            An SSL certificate adds the padlock icon and HTTPS to your site. Without it, browsers show a "Not Secure" warning that drives visitors away.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {sslOptions.map((opt, i) => (
            <motion.div
              key={opt.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-card rounded-3xl border border-border p-7 flex flex-col hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase mb-3">{opt.type}</span>
              <h3 className="font-bold text-xl mb-3">{opt.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{opt.desc}</p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {opt.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-primary shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-5">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Starting From</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-primary leading-none">KES {opt.from.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm mb-0.5">/{opt.period}</span>
                </div>
              </div>

              <Button
                className="w-full font-semibold rounded-2xl cursor-pointer h-11 gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => navigate(opt.href)}
              >
                {opt.cta} <ArrowRight size={15} />
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold mb-3">Beyond SSL - Get Comprehensive Website Security</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            SSL encrypts your traffic. Now add malware detection and removal, daily backups, and a Web Application Firewall to truly protect your website from every angle.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
