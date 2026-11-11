import { motion } from "motion/react";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "sales@nisccloud.com",
    href: "mailto:sales@nisccloud.com",
    sub: "We reply within 24 hours",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+254 748 777 666",
    href: "tel:+254748777666",
    sub: "Sales Mon–Fri · Support requests any time",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Nairobi, Kenya",
    href: null as string | null,
    sub: "Our office",
  },
];

const quickRoutes = [
  { label: "Search for a domain", href: "/hosting/domains" },
  { label: "Compare hosting and service plans", href: "/pricing" },
  { label: "Browse the Help Centre", href: "/help" },
];

export default function ContactInfo() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="rounded-2xl border border-border/60 bg-card p-6"
    >
      <h2 className="type-h3 mb-1">Talk to us directly</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Prefer email or a call? Reach the team here.
      </p>

      <div className="space-y-4">
        {contactDetails.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  {item.value}
                </a>
              ) : (
                <div className="text-sm font-medium text-foreground">{item.value}</div>
              )}
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border/60 pt-5">
        <h2 className="type-h3 mb-3">Ready to start on your own?</h2>
        <ul className="space-y-1">
          {quickRoutes.map((r) => (
            <li key={r.href}>
              <Link
                to={r.href}
                className="group -mx-2 flex items-center justify-between rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                {r.label}
                <ArrowRight size={14} className="text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}
