import { motion } from "motion/react";
import { Mail, Phone, MapPin } from "lucide-react";

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
    sub: "Sales Mon–Fri · Support 24/7",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Nairobi, Kenya",
    href: null as string | null,
    sub: "Our office",
  },
];

export default function ContactInfo() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="rounded-2xl border border-border/60 bg-card p-6"
    >
      <h3 className="mb-1 text-base font-semibold tracking-tight">Talk to us directly</h3>
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
    </motion.aside>
  );
}
