import { motion } from "motion/react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Calendar,
} from "lucide-react";

const contactDetails = [
  {
    icon: Mail,
    label: "Email Us",
    value: "sales@nisccloud.com",
    sub: "We reply within 24 hours",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+254 748 777 666",
    sub: "Sales: Mon-Fri, 9am-6pm EAT · Support: 24/7",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Nairobi, Kenya",
    sub: "Our office",
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Under 24 hours",
    sub: "Usually much faster",
  },
];

const whyUs = [
  { icon: MessageSquare, text: "Free strategy session on the first call. Clear advice, no hard sell." },
  { icon: Calendar, text: "Proposals delivered within 48 hours of your enquiry" },
];

export default function ContactInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Contact details */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
        <h3 className="font-semibold text-base mb-1">Contact Details</h3>
        {contactDetails.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <item.icon size={15} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Why reach out */}
      <div className="bg-card border border-border/60 rounded-2xl p-6">
        <h3 className="font-semibold text-base mb-4">What to Expect</h3>
        <div className="space-y-3">
          {whyUs.map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={13} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div
        className="rounded-2xl p-6 border border-primary/20 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 100%, oklch(0.20 0.06 220 / 0.4), transparent)",
        }}
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-[10px] text-primary font-mono mb-4">
          NEXT STEPS
        </div>
        <div className="space-y-3">
          {[
            { step: "01", label: "Submit this form" },
            { step: "02", label: "Free strategy call" },
            { step: "03", label: "Custom proposal in 48hrs" },
            { step: "04", label: "We help you get online and grow" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <span className="text-xs font-mono text-primary/70 w-6 shrink-0">{s.step}</span>
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
