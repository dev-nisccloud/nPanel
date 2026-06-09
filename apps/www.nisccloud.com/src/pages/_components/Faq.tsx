import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "What does 'A-to-Z digital partner' mean?",
        a: "It means we handle every digital need your business has - from creating your brand identity and building your website, to hosting it on the cloud, running your marketing campaigns, and automating your growth with Zeepo AI. You work with one team, get one invoice, and never have to juggle multiple agencies.",
      },
      {
        q: "How is Nisc Cloud different from hiring separate agencies?",
        a: "When you hire separate agencies for design, hosting, SEO, and ads - they don't talk to each other. Your brand looks different everywhere, strategies conflict, and you spend time coordinating. At Nisc Cloud, everything is integrated under one strategy, one brand voice, and one accountable team.",
      },
      {
        q: "Do you serve businesses outside Kenya?",
        a: "Yes. While we are based in Nairobi and primarily serve Kenyan businesses, we work with clients across Africa and remotely worldwide. All services are available remotely.",
      },
    ],
  },
  {
    category: "Hosting & Domains",
    items: [
      {
        q: "How fast can my website go live?",
        a: "Domain registration is instant. Once you choose a hosting plan and complete setup, your site can be live within hours. For a fully designed website, delivery timelines range from 5 days (landing page) to 21 days (e-commerce store).",
      },
      {
        q: "What happens if my website goes down?",
        a: "We guarantee 99.9% uptime on all hosting plans. If there is ever downtime, our 24/7 support team is notified automatically and works to restore service immediately. Managed VPS clients get a dedicated response within 15 minutes.",
      },
      {
        q: "Can I transfer my existing domain to Nisc Cloud?",
        a: "Yes. We support domain transfers from any registrar. The process takes 5–7 days. Our team will guide you step by step at no extra cost. Transfer pricing is listed on our Domains page.",
      },
      {
        q: "Do you support .co.ke domains?",
        a: "Yes. We are an accredited .co.ke registrar through KENIC (Kenya Network Information Centre). We support .co.ke, .ke, .com, .africa, .net, .org, and many more extensions.",
      },
    ],
  },
  {
    category: "Marketing & Branding",
    items: [
      {
        q: "How long does SEO take to show results?",
        a: "SEO is a long-term strategy. Most clients start seeing measurable improvements in rankings and organic traffic within 60–90 days. Significant results (top 3 Google rankings for target keywords) typically come within 4–6 months of consistent work.",
      },
      {
        q: "What is AEO and GEO?",
        a: "AEO (Answer Engine Optimisation) means optimising your content to appear in AI-powered search tools like ChatGPT, Perplexity, and Google's AI Overviews. GEO (Generative Engine Optimisation) targets Google Maps and local AI results. Together with traditional SEO, they ensure customers find you everywhere they search - not just on Google.",
      },
      {
        q: "Do I need a minimum ad spend budget for paid advertising?",
        a: "Yes. Our Ads Starter plan requires a minimum ad spend of KES 10,000/mo (separate from our management fee). This is the budget that goes directly to Google or Meta for your ads. We recommend KES 20,000–50,000/mo for optimal results.",
      },
      {
        q: "Can you manage my existing social media accounts?",
        a: "Absolutely. We can take over existing accounts or set up new ones. We start with a full audit of your current presence, then build a content calendar and strategy aligned with your brand.",
      },
    ],
  },
  {
    category: "Zeepo AI",
    items: [
      {
        q: "What is Zeepo AI?",
        a: "Zeepo AI is our proprietary AI-powered marketing automation platform. It creates content (blog posts, social captions, ad copy), automates your email sequences, manages CRM workflows, runs chatbot flows, and nurtures leads automatically - so your marketing runs 24/7 even when your team is offline.",
      },
      {
        q: "Do I need technical knowledge to use Zeepo AI?",
        a: "No. Zeepo AI is fully managed by our team. We set up all workflows, train the AI on your brand voice, and manage everything. You simply review outputs and approve campaigns. No coding or technical skills required.",
      },
    ],
  },
  {
    category: "Billing & Support",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept M-Pesa (Paybill and Till), Visa, Mastercard, and bank transfer (KCB, Equity, NCBA). Monthly retainers can be set up on auto-pay via M-Pesa standing order.",
      },
      {
        q: "Is there a contract or can I cancel anytime?",
        a: "Monthly services (hosting, SEO, ads, social media) are month-to-month with 30 days notice to cancel. One-off projects (website design, brand identity) are paid per milestone. We do not lock clients into long-term contracts - we earn your business every month.",
      },
      {
        q: "What does your '30-day results' guarantee mean?",
        a: "For marketing services, if we don't show measurable progress within 30 days (traffic increase, leads generated, or campaign launch), we continue working at no extra charge until we do. We define 'measurable progress' clearly in your onboarding agreement.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "border border-border rounded-xl overflow-hidden transition-colors duration-200",
        open ? "bg-primary/5 border-primary/30" : "bg-card hover:border-primary/20"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer gap-4"
      >
        <span className="font-semibold text-sm md:text-base text-foreground">{q}</span>
        <span className="shrink-0 text-primary">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState("General");

  const current = faqs.find((f) => f.category === activeCategory);

  return (
    <section className="py-24 px-4 bg-background" id="faq">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to know before getting started with Nisc Cloud.
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {faqs.map((f) => (
            <button
              key={f.category}
              onClick={() => setActiveCategory(f.category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border",
                activeCategory === f.category
                  ? "bg-primary text-white border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {f.category}
            </button>
          ))}
        </motion.div>

        {/* FAQ items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {current?.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 text-center bg-muted/50 border border-border rounded-2xl p-6"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Still have questions? Our team is based in Nairobi and replies within 2 hours.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            Talk to us → hello@nisccloud.com
          </a>
        </motion.div>
      </div>
    </section>
  );
}
