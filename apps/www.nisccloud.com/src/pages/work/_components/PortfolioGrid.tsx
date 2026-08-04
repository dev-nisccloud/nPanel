import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { caseStudies } from "../_lib/case-studies.ts";
import type { CaseStudy } from "../_lib/case-studies.ts";

const FILTERS = ["All", "Create", "Launch", "Market", "Automate", "Full Atom"] as const;

export default function PortfolioGrid() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const navigate = useNavigate();

  const filtered =
    activeFilter === "All"
      ? caseStudies
      : caseStudies.filter((c) => c.category === activeFilter);

  return (
    <section className="pb-12 px-4 md:px-8 max-w-6xl mx-auto bg-background">
      <div className="flex flex-wrap gap-1.5 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              activeFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground py-12 text-center"
          >
            No case studies in this category yet.
          </motion.p>
        ) : (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="divide-y divide-border rounded-xl border border-border overflow-hidden"
          >
            {filtered.map((study, i) => (
              <CaseStudyRow
                key={study.slug}
                study={study}
                index={i}
                onClick={() => navigate(`/work/${study.slug}`)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CaseStudyRow({
  study,
  index,
  onClick,
}: {
  study: CaseStudy;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      onClick={onClick}
      className="group cursor-pointer flex gap-4 p-4 md:p-5 bg-background hover:bg-muted/30 transition-colors"
    >
      {/* Minimal thumb */}
      <div className="relative h-16 w-24 md:h-[72px] md:w-[108px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        <img
          src={study.coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-primary mb-1">
          {study.category}
          <span className="text-muted-foreground"> · {study.industry}</span>
        </p>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
              {study.client}
            </h2>
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{study.tagline}</p>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1.5 hidden sm:block">
              {study.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {study.duration}
              </span>
              <span>{study.year}</span>
              {study.results.slice(0, 2).map((r) => (
                <span key={r.label}>
                  <span className="font-semibold text-foreground">{r.value}</span>{" "}
                  {r.label}
                </span>
              ))}
            </div>
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          />
        </div>
      </div>
    </motion.article>
  );
}
