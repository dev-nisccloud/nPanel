import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Bot, Workflow, BarChart3 } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";

const features: ServiceFeature[] = [
  { icon: Workflow, title: "Workflow Integrations", desc: "Map repetitive steps and confirm which supported systems, permissions and approvals are required before integration." },
  { icon: ZepoMascot, title: "Zepo AI Chat", href: "/services/zepo-ai", desc: "Assistance for supported customer, marketing and Nisc Cloud service questions, with escalation when a person needs to take over." },
  { icon: Bot, title: "Email Sequences", href: "/services/email-marketing", desc: "Plan approved follow-up for supported triggers, with consent, review and sending responsibilities clearly assigned." },
  { icon: BarChart3, title: "Activity & Reporting", desc: "Review supported workflow activity, handoffs and outcomes without presenting inferred revenue as confirmed fact." },
];

const included = [
  "Workflow and system assessment",
  "Supported integration scope",
  "Approved business context for Zepo",
  "Human review and escalation rules",
  "Activity records where available",
  "Ongoing scope agreed in the proposal",
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
            <ShowcaseVisualCard visual="automation" headline="Automation with clear control" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Automation Across <br />
              <span className="text-primary">Build, Run and Grow.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Use automation where it removes repetitive work without hiding responsibility. We define the supported systems, approval points, data boundaries and human handoff before activation.
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
