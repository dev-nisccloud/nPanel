import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const faqs = [
  {
    q: "Do I need an SSL certificate for my website?",
    a: "Yes - absolutely. Without SSL, browsers show a 'Not Secure' warning to your visitors, which damages trust and hurts your Google rankings. SSL encrypts the connection between your website and your visitors, protecting sensitive data like passwords and payment details.",
  },
  {
    q: "What's the difference between DV, OV, and EV SSL?",
    a: "DV (Domain Validation) is the fastest and most common - it just verifies you own the domain. OV (Organisation Validation) also verifies your business identity, building more trust. EV (Extended Validation) provides the highest level of validation and shows your business name in the address bar. For most Kenyan businesses, DV or OV is sufficient.",
  },
  {
    q: "How does malware scanning work?",
    a: "Our automated system scans your website up to 4 times per day for malware, suspicious code injections, backdoors, and blacklist status. If anything is detected, you receive an immediate alert and our security experts can clean your site - depending on your plan.",
  },
  {
    q: "What is a Web Application Firewall (WAF)?",
    a: "A WAF sits in front of your website and monitors all incoming traffic. It blocks common attacks like SQL injection, cross-site scripting (XSS), and brute force attempts before they can reach your site - protecting you 24/7 without any action required on your part.",
  },
  {
    q: "How quickly can you clean a hacked website?",
    a: "For active website security plan subscribers, our team typically begins remediation within 4 business hours of a confirmed hack. The full cleanup process usually takes 24–48 hours depending on the extent of the infection. Premium plan subscribers get priority SLA response.",
  },
  {
    q: "Are the backups stored off-site?",
    a: "Yes. All backups are stored in encrypted, geographically separate data centres from your website. This means even if your hosting server fails completely, your backup remains safe and restorable.",
  },
  {
    q: "Can I add security to an existing website?",
    a: "Yes. You can add website security and SSL to any existing website hosted anywhere - not just Nisc Cloud hosted sites. Simply purchase a plan and our team will guide you through the setup process.",
  },
];

export default function SecurityFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">FAQ</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">Website Security Questions</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">Everything you need to know about protecting your website.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
              >
                {faq.q}
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 ml-4 text-muted-foreground transition-transform duration-200",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
