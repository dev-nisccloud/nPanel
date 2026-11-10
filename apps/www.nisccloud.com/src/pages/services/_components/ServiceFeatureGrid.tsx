import type { ComponentType } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export type ServiceFeature = {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href?: string;
};

const CARD =
  "group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 transition-all";

function CardBody({ f }: { f: ServiceFeature }) {
  return (
    <>
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <f.icon size={16} />
      </div>
      <h3 className="mb-1 text-sm font-normal">{f.title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
      {f.href ? (
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-primary">
          Learn more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      ) : null}
    </>
  );
}

export function ServiceFeatureGrid({ features }: { features: ServiceFeature[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          {f.href ? (
            <Link
              to={f.href}
              className={`${CARD} hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:hover:translate-y-0`}
            >
              <CardBody f={f} />
            </Link>
          ) : (
            <div className={`${CARD} hover:border-primary/30`}>
              <CardBody f={f} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
