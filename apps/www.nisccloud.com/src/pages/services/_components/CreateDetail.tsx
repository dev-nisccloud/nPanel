import { motion } from "motion/react";
import { Check, Paintbrush, Layers, Type, Palette } from "lucide-react";

const features = [
  { icon: Palette, title: "Brand Identity", desc: "Logo, color palette, typography system, brand guidelines delivered in one cohesive package." },
  { icon: Layers, title: "Web Design & Dev", desc: "Custom-designed, conversion-optimized websites built for speed, mobile, and search engines." },
  { icon: Type, title: "Copywriting", desc: "Strategic messaging, tone of voice, and copy for every page, ad, and campaign you run." },
  { icon: Paintbrush, title: "Creative Assets", desc: "Social graphics, banners, pitch decks, and marketing collateral ready to deploy." },
];

const included = [
  "Logo + icon system (3 concepts)",
  "Full color & typography guide",
  "Custom website (up to 10 pages)",
  "Mobile-responsive design",
  "Brand asset library",
  "Strategy session included",
];

export default function CreateDetail() {
  return (
    <section id="create" className="py-24 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Label + heading */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[oklch(0.72_0.2_210/0.1)] border border-[oklch(0.72_0.2_210/0.3)] rounded-full px-4 py-1.5 text-xs font-mono mb-4" style={{ color: "oklch(0.72 0.2 210)" }}>
              01 - CREATE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              We Build Your<br />
              <span style={{ color: "oklch(0.72 0.2 210)" }}>Brand from Zero.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Before you can launch, you need an identity that commands attention. We craft every visual and verbal element of your brand - ensuring it's built to scale and impossible to ignore.
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
            className="relative rounded-2xl overflow-hidden aspect-[4/3]"
          >
            <img
              src="https://images.unsplash.com/photo-1684503830693-117be55da983?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
              alt="Brand creation"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
            {/* Floating stat */}
            <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur border border-border/60 rounded-xl px-5 py-3">
              <div className="text-2xl font-bold text-primary">48hr</div>
              <div className="text-xs text-muted-foreground">Avg. first concept delivery</div>
            </div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 transition-all"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "oklch(0.72 0.2 210 / 0.12)", color: "oklch(0.72 0.2 210)" }}>
                <f.icon size={16} />
              </div>
              <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
