import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Our team will help you transition smoothly.",
  },
  {
    q: "Is there a setup or onboarding fee?",
    a: "No. Every plan includes a free onboarding session and strategy call. We do not charge setup fees - the price you see is the price you pay.",
  },
  {
    q: "What does 'managed cloud hosting' include?",
    a: "Our managed hosting covers server provisioning, SSL, CDN, daily automated backups, uptime monitoring, security patches, and zero-downtime deployments. You never touch a server.",
  },
  {
    q: "How long until my website is live?",
    a: "For Launchpad plans, expect your first design concepts within 48 hours of onboarding and a live website within 2–3 weeks. Orbit and Galaxy timelines are discussed during your strategy call.",
  },
  {
    q: "Do I own my website and brand assets?",
    a: "Yes - completely. Once your project is delivered, all brand files, website code, and creative assets are yours. If you ever leave, we provide a full handover package.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Monthly plans can be cancelled with 30 days' notice. Annual plans are non-refundable but we'll always work with you to get value from your remaining term.",
  },
  {
    q: "What platforms do you manage for social media?",
    a: "We manage Instagram, Facebook, LinkedIn, X (Twitter), TikTok, and YouTube. Each plan specifies the number of platforms included. You can always add more via our add-ons.",
  },
  {
    q: "Do you work with businesses outside Ghana?",
    a: "Yes - we're remote-first and work with clients worldwide. Our team operates across multiple time zones and all communication is handled digitally.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-border/60 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <span className="font-medium text-sm">{q}</span>
        <div className="shrink-0 w-6 h-6 rounded-full border border-border/60 flex items-center justify-center">
          {open ? <Minus size={12} className="text-primary" /> : <Plus size={12} className="text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PricingFAQ() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            PRICING FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Common Questions
          </h2>
          <p className="text-muted-foreground text-base">
            Everything you need to know before committing to a plan.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
