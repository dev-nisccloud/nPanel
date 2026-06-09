import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  text: string;
  initials: string;
  accentClass: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    role: "CEO, TechStart Kenya",
    text: "Nisc Cloud took us from zero online presence to generating 200+ leads per month in just 60 days. The all-in-one approach saved us from managing 5 different vendors.",
    initials: "SM",
    accentClass: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "James O.",
    role: "Founder, AfriCommerce",
    text: "Their hosting is rock-solid and the marketing team actually understands our market. We've seen 3× ROI on our ad spend since switching to Nisc.",
    initials: "JO",
    accentClass: "bg-violet-500/20 text-violet-400",
  },
  {
    name: "Grace W.",
    role: "Marketing Director, BuildAfrica",
    text: "The AI automation tools alone are worth it - we create social media content, email campaigns, and landing pages in minutes. Plus the dedicated server never goes down.",
    initials: "GW",
    accentClass: "bg-emerald-500/20 text-emerald-400",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            CLIENT STORIES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            500+ Kenyan Businesses Trust Nisc
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Real results from real businesses we helped create, launch, and grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} className="fill-primary text-primary" />
                ))}
              </div>

              <Quote size={20} className="text-primary/30 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {t.text}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${t.accentClass}`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
