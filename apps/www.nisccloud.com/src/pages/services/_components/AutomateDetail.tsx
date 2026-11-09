import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Bot, Workflow, MessageSquare, BarChart3 } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features: ServiceFeature[] = [
  { icon: Workflow, title: "CRM Workflows", desc: "HubSpot, Salesforce, GoHighLevel: we build automations that move leads through your funnel without manual chasing." },
  { icon: MessageSquare, title: "AI Chatbots", href: "/services/zeepo-ai", desc: "Chatbots trained on your brand voice to qualify leads, answer questions, and book calls 24/7." },
  { icon: Bot, title: "Email Sequences", href: "/services/email-marketing", desc: "Drip campaigns triggered by behaviour: sign-ups, cart abandonment, re-engagement, and upsells." },
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
    <section id="automate" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <ShowcaseVisualCard visual="automation" headline="Working 24/7" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Your Business. <br />
              <span className="text-primary">Working 24/7.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Good marketing systems keep working after office hours. We set up AI automations across your CRM, email, chat, and reporting so leads get a fast reply and your team stays focused.
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <ServiceFeatureGrid features={features} />
      </div>
    </section>
  );
}
