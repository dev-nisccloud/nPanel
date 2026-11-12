import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Search, TrendingUp, Share2, Mail } from "lucide-react";
import ServiceStatistics, {
  trustStatsToStatisticsItems,
} from "@/components/shadcn-space/blocks/statistics-02/statistics.tsx";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features: ServiceFeature[] = [
  { icon: Search, title: "SEO & Content", href: "/services/seo", desc: "Technical audits, keyword strategy, and content that help people find you on Google, Maps, and AI answers." },
  { icon: TrendingUp, title: "Paid Media", href: "/services/paid-ads", desc: "Campaigns across Google, Meta, TikTok, and LinkedIn managed for leads and sales, with clear reporting." },
  { icon: Share2, title: "Social Media", href: "/services/social-media", desc: "Strategy, design, posting, and community replies across the platforms your customers use." },
  { icon: Mail, title: "Email Marketing", href: "/services/email-marketing", desc: "Automated sequences, broadcast campaigns, and testing to turn subscribers into buyers." },
];

const included = [
  "Full SEO audit & strategy",
  "Google & Meta ad campaigns",
  "Social media management",
  "Monthly analytics reports",
  "Content calendar",
  "Dedicated account manager",
];

const metrics = [
  { value: "Monthly", label: "Transparent reporting" },
  { value: "Dedicated", label: "Account manager" },
  { value: "Free", label: "Strategy call" },
];

export default function MarketDetail() {
  return (
    <section id="grow" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="type-h2 mb-5">
              Grow with connected channels. <br />
              <span className="text-primary">Learn from clear evidence.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Connect search, paid media, social and email around the same audience and business goals. Reporting separates activity, observed performance and the next decision.
            </p>
            <ul className="grid grid-cols-2 gap-2 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={14} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <ServiceStatistics
              embedded
              compact
              className="pt-6"
              items={trustStatsToStatisticsItems(
                metrics.map((m) => ({ label: m.label, value: m.value })),
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ShowcaseVisualCard visual="reporting" headline="Clear growth reporting" />
          </motion.div>
        </div>

        <ServiceFeatureGrid features={features} />
      </div>
    </section>
  );
}
