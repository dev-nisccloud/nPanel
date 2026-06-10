import { motion } from "motion/react";

export default function OurStory() {
  const milestones = [
    {
      year: "2018",
      title: "The Spark",
      description:
        "Founded in a small co-working space, Nisc Cloud started with a single mission: help local businesses compete online with enterprise-grade strategy.",
    },
    {
      year: "2020",
      title: "The Atom Approach",
      description:
        "After serving 50+ clients, we distilled our best practices into a repeatable framework - Create, Launch, Market, Automate - that consistently delivers results.",
    },
    {
      year: "2022",
      title: "Going National",
      description:
        "Word spread fast. We expanded from regional projects to working with brands across the country, growing our team and sharpening our methodology.",
    },
    {
      year: "2024",
      title: "300+ Launches",
      description:
        "Today, Nisc Cloud has helped over 300 businesses launch, grow, and automate - and we're just getting started.",
    },
  ];

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-3xl" />
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwzfHx0ZWNoJTIwdGVhbSUyMHByb2Zlc3Npb25hbHMlMjBvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Nisc Cloud team collaborating"
            className="relative rounded-2xl w-full object-cover aspect-[4/3]"
          />
          <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground rounded-xl px-6 py-4 shadow-xl">
            <p className="text-3xl font-bold">300+</p>
            <p className="text-sm opacity-80">Launches & counting</p>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Built from the Ground Up
            </h2>
            <p className="text-muted-foreground">
              Every great agency has an origin story. Ours began with a
              frustration - too many businesses were leaving growth on the
              table because they lacked the right systems.
            </p>
          </motion.div>

          <div className="space-y-6 relative">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 pl-2"
              >
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full bg-primary border-4 border-background" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-primary tracking-widest">
                      {m.year}
                    </span>
                    <span className="font-semibold">{m.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
