import { motion } from "motion/react";
import { ServiceFeatureGrid, type ServiceFeature } from "./ServiceFeatureGrid.tsx";
import { Check, Paintbrush, Layers, Type, Palette } from "lucide-react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const features: ServiceFeature[] = [
  { icon: Palette, title: "Brand Identity", href: "/services/brand-identity", desc: "Logo, colour palette, typography system, and brand guidelines delivered as one clear package." },
  { icon: Layers, title: "Web Design & Dev", href: "/services/website-design", desc: "Custom websites built for speed, mobile use, and search engines, with a focus on turning visitors into customers." },
  { icon: Type, title: "Custom software", href: "/services/software", desc: "Web applications, mobile applications and internal tools, scoped and quoted before build." },
  { icon: Paintbrush, title: "Creative Assets", desc: "Social graphics, banners, pitch decks, and marketing materials ready to use." },
];

const included = [
  "Brand and positioning scope",
  "Visual and verbal identity systems",
  "Website or software experience design",
  "Responsive implementation",
  "Approved source assets and handover",
  "Clear review and approval stages",
];

export default function CreateDetail() {
  return (
    <section id="build" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="type-h2 mb-5">
              We build your <br />
              <span className="text-primary">brand from the ground up.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Turn strategy into a brand, website or software experience people can understand and use. Scope, ownership and approval stages are agreed before delivery begins.
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

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ShowcaseVisualCard visual="brand" headline="Brand from the ground up" />
          </motion.div>
        </div>

        <ServiceFeatureGrid features={features} />
      </div>
    </section>
  );
}
