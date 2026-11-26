import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ValueVignette } from "@/components/artwork/about-art.tsx";

const values = [
  {
    title: "Results first",
    description: "Every plan we recommend ties to a clear outcome. If it does not help you get online, stay online or grow, we do not build it.",
  },
  {
    title: "Speed matters",
    description: "Momentum compounds online. We move quickly, ship what works and improve as we go instead of waiting for perfect.",
  },
  {
    title: "Client-obsessed",
    description: "We treat every business like it is our own. Your wins are our wins, and we stay with you when things get hard.",
  },
  {
    title: "Radical transparency",
    description: "No jargon, no fluff metrics, no hidden fees. You always know what we are doing and why.",
  },
  {
    title: "Always learning",
    description: "Hosting and marketing change fast. We keep learning so your setup stays current without you chasing every trend.",
  },
  {
    title: "Built together",
    description: "The best outcomes happen when we work as one team with you. We are collaborators, not distant vendors.",
  },
];

function ValueCard({ index, title, description }: { index: number; title: string; description: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hover, setHover] = useState(false);
  const [replay, setReplay] = useState(0);
  const reduce = useReducedMotion();
  return (
    <motion.li
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
      onMouseEnter={() => {
        setHover(true);
        setReplay((n) => n + 1);
      }}
      onMouseLeave={() => setHover(false)}
      className={`rounded-[24px] border bg-card p-3 transition-colors duration-300 ${hover ? "border-[#38b6ff]" : "border-border"}`}
    >
      <ValueVignette key={replay} index={index} active={inView} />
      <div className="px-3 pb-3 pt-5">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.li>
  );
}

export default function CoreValues() {
  return (
    <section aria-labelledby="values-title" className="px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
          <div>
            <p className="type-label text-[#38b6ff]">Core values</p>
            <h2 id="values-title" className="type-h2 mt-3 text-balance">
              Six promises we keep to every business we work with
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground md:justify-self-end">
            They decide how we plan, how we talk to you and what we do when something goes wrong.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <ValueCard key={value.title} index={index} title={value.title} description={value.description} />
          ))}
        </ul>
      </div>
    </section>
  );
}
