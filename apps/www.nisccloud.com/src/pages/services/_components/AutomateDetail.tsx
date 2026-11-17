import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, LayoutTemplate, Plug, Send } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";

const features: ServiceFeature[] = [
  { icon: ZepoMascot, title: "Zepo AI", href: "/services/zepo-ai", desc: "Your assistant inside nPanel. It answers from your account, reads and drafts your email, and takes on research and writing." },
  { icon: Send, title: "Nisc Outreach", href: "/services/email-marketing", desc: "AI email marketing. Describe a campaign and the AI designs it from your brand, then track opens and clicks." },
  { icon: Plug, title: "Email MCP", href: "/platform#email-mcp", desc: "Connect your Nisc Cloud mailbox to ChatGPT, Claude or another MCP assistant to read, draft, reply and send." },
  { icon: LayoutTemplate, title: "AI Website Builder (coming soon)", href: "/services/ai-website-builder", desc: "Describe your business and get a website with your brand, published on Nisc Cloud hosting from nPanel." },
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
            <h2 className="type-h2 mb-5">
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
