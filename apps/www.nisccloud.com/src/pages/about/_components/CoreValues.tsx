import { motion } from "motion/react";
import { Target, Zap, Heart, Shield, Lightbulb, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Results First",
    description:
      "Every strategy we recommend is tied to a measurable outcome. If it doesn't move the needle, we don't build it.",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    description:
      "In digital, momentum compounds. We move fast, iterate quickly, and ship before perfection kills progress.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Heart,
    title: "Client-Obsessed",
    description:
      "We treat every business like it's our own. Your wins are our wins — and your challenges wake us up at night.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: Shield,
    title: "Radical Transparency",
    description:
      "No jargon, no vanity metrics, no hidden fees. You'll always know exactly what we're doing and why.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Lightbulb,
    title: "Always Learning",
    description:
      "Digital evolves daily. We invest heavily in staying ahead — so you never have to worry if your strategy is outdated.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Built Together",
    description:
      "The best outcomes happen when client and agency work as one team. We're collaborators, not vendors.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

export default function CoreValues() {
  return (
    <section className="py-20 px-4 md:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold text-primary tracking-widest uppercase mb-3">
            What Drives Us
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Core Values</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            These aren't words on a wall. They're the principles that shape
            every decision, every strategy, every result.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <div className={`${v.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <v.icon className={`w-6 h-6 ${v.color}`} />
              </div>
              <h3 className="font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
