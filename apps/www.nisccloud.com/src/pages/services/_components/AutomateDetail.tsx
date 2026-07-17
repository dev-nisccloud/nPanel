import { motion } from "motion/react";
import { Check, Bot, Workflow, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  { icon: Workflow, title: "CRM Workflows", desc: "HubSpot, Salesforce, GoHighLevel: we build automations that move leads through your funnel without manual chasing." },
  { icon: MessageSquare, title: "AI Chatbots", desc: "Chatbots trained on your brand voice to qualify leads, answer questions, and book calls 24/7." },
  { icon: Bot, title: "Email Sequences", desc: "Drip campaigns triggered by behaviour: sign-ups, cart abandonment, re-engagement, and upsells." },
  { icon: BarChart3, title: "Reporting Dashboards", desc: "Clear dashboards showing traffic, conversations, conversions, and revenue in one place." },
];

const included = [
  "CRM setup & integration",
  "Lead scoring automation",
  "AI chatbot (trained on your brand)",
  "Email drip sequences",
  "Reporting dashboard",
  "Monthly optimization calls",
];

export default function AutomateDetail() {
  return (
    <section id="automate" className="py-24 border-t border-border/40" style={{ background: "radial-gradient(ellipse 80% 50% at 0% 50%, oklch(0.78 0.16 150 / 0.06), transparent)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden aspect-[4/3] order-2 lg:order-1"
          >
            <img
              src="https://images.unsplash.com/photo-1694903089438-bf28d4697d9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
              alt="Automation technology"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-tl from-background/80 via-transparent to-transparent" />
            <div className="absolute top-6 left-6 bg-card/90 backdrop-blur border border-border/60 rounded-xl px-5 py-3">
              <div className="text-2xl font-bold" style={{ color: "oklch(0.78 0.16 150)" }}>24/7</div>
              <div className="text-xs text-muted-foreground">Follow-up and support coverage</div>
            </div>
            {/* Workflow nodes visual */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-1.5">
              {["Lead Capture", "Email Sent", "CRM Updated"].map((step) => (
                <div key={step} className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border/60 rounded-lg px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground font-mono">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-mono mb-4" style={{ backgroundColor: "oklch(0.78 0.16 150 / 0.1)", borderColor: "oklch(0.78 0.16 150 / 0.3)", color: "oklch(0.78 0.16 150)" }}>
              04 - AUTOMATE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Your Business.<br />
              <span style={{ color: "oklch(0.78 0.16 150)" }}>Working 24/7.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Good marketing systems keep working after office hours. We set up AI automations across your CRM, email, chat, and reporting so leads get a fast reply and your team stays focused.
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} style={{ color: "oklch(0.78 0.16 150)" }} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border/60 rounded-xl p-5 transition-all hover:border-[oklch(0.78_0.16_150/0.4)]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "oklch(0.78 0.16 150 / 0.12)", color: "oklch(0.78 0.16 150)" }}>
                <f.icon size={16} />
              </div>
              <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
