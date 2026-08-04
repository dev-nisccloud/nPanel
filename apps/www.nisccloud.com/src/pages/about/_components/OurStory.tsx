import { motion } from "motion/react";

const milestones = [
  {
    year: "2018",
    title: "The Spark",
    description:
      "We started with a simple goal: help local businesses get online with reliable hosting and clear marketing support.",
  },
  {
    year: "2020",
    title: "The Atom Approach",
    description:
      "After working with dozens of clients, we shaped a repeatable process: Create, Host, Market, Automate. It keeps projects clear and results measurable.",
  },
  {
    year: "2022",
    title: "Growing With Our Clients",
    description:
      "Word spread. We grew our team and started supporting businesses of every size, near and far, with the same hands-on approach.",
  },
  {
    year: "2024",
    title: "100+ Businesses",
    description:
      "Today we help 100+ businesses get online, stay online, and grow. Free migration, setup help, and 24/7 support are part of how we work.",
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
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-3xl" />
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwzfHx0ZWNoJTIwdGVhbSUyMHByb2Zlc3Npb25hbHMlMjBvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Our team collaborating"
            className="relative rounded-2xl w-full object-cover aspect-[4/3]"
          />
          <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-primary text-primary-foreground rounded-xl px-5 py-3.5 shadow-xl">
            <p className="text-2xl font-bold leading-none">100+</p>
            <p className="text-xs opacity-80 mt-1">Businesses growing with us</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Built from the Ground Up
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              Too many businesses were stuck between flaky hosting and scattered
              marketing vendors. We built one team that handles both, with clear
              plans and real support.
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
                    <h3 className="text-base font-semibold text-foreground">
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
