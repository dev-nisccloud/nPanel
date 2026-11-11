import { motion } from "motion/react";
import { ShowcaseVisualCard } from "@/pages/_components/ServiceShowcaseSection.tsx";

const milestones = [
  {
    year: "2019",
    title: "Nisc Cloud begins",
    description:
      "Nisc Cloud started with a practical goal: give businesses reliable technology and a team that takes responsibility for getting the work done.",
  },
  {
    year: "Build",
    title: "Make ideas real",
    description:
      "We help businesses shape their brand, launch websites and ecommerce experiences, and build software around the way they work.",
  },
  {
    year: "Run",
    title: "Keep business moving",
    description:
      "Domains, hosting, email, servers and security keep the digital operation available, connected and supported through nPanel.",
  },
  {
    year: "Grow",
    title: "Support sustainable growth",
    description:
      "Marketing and automation support the same journey. Today, Nisc Cloud serves thousands of customers while keeping one accountable team across Build, Run and Grow.",
  },
];

export default function OurStory() {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <ShowcaseVisualCard visual="uptime" headline="Hosting, web and growth together" />
          <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-primary text-primary-foreground rounded-xl px-5 py-3.5 shadow-xl">
            <p className="text-2xl font-bold leading-none">One team</p>
            <p className="text-xs opacity-80 mt-1">Hosting, web and growth together</p>
          </div>
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="type-h2 mb-4">
              Built to Grow with Our Customers
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              Since 2019, Nisc Cloud has grown from reliable infrastructure into
              a technology company that brings cloud, software and digital growth
              together for businesses, agencies and developers.
            </p>
          </motion.div>

          <ol className="relative m-0 list-none p-0">
            {/* Spine */}
            <div
              className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent"
              aria-hidden
            />

            {milestones.map((m, i) => (
              <motion.li
                key={m.year}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={`relative flex gap-5 ${i < milestones.length - 1 ? "pb-8" : ""}`}
              >
                <div className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="absolute h-4 w-4 rounded-full bg-primary/15" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <time className="text-xs font-semibold tabular-nums text-primary">
                      {m.year}
                    </time>
                    <h3 className="type-h3 text-foreground">
                      {m.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
