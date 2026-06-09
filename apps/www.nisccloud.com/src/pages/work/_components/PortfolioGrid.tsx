import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { caseStudies } from "../_lib/case-studies.ts";
import type { CaseStudy } from "../_lib/case-studies.ts";

const FILTERS = ["All", "Create", "Launch", "Market", "Automate", "Full Atom"] as const;

export default function PortfolioGrid() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const navigate = useNavigate();

  const filtered = activeFilter === "All"
    ? caseStudies
    : caseStudies.filter((c) => c.category === activeFilter);

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-12 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              activeFilter === f
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((study, i) => (
            <CaseStudyCard
              key={study.slug}
              study={study}
              index={i}
              onClick={() => navigate(`/work/${study.slug}`)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function CaseStudyCard({
  study,
  index,
  onClick,
}: {
  study: CaseStudy;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Cover image */}
      <div className="relative overflow-hidden aspect-video">
        <img
          src={study.coverImage}
          alt={study.client}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-background/80 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full border border-border text-primary">
            {study.category}
          </span>
        </div>

        {/* Meta overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {study.duration}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {study.year}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
          {study.industry}
        </p>
        <h3 className="font-bold text-lg mb-1">{study.client}</h3>
        <p className={`text-sm font-semibold mb-3 ${study.accentColor}`}>
          {study.tagline}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {study.description}
        </p>

        {/* Key results row */}
        <div className="flex items-center gap-4 text-xs font-bold border-t border-border pt-4">
          {study.results.slice(0, 2).map((r) => (
            <div key={r.label} className="flex-1">
              <p className="text-foreground text-base">{r.value}</p>
              <p className="text-muted-foreground font-normal">{r.label}</p>
            </div>
          ))}
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
