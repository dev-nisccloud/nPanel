import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Calendar, CheckCircle2, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import { caseStudies } from "./_lib/case-studies.ts";
import NotFound from "../NotFound.tsx";

export default function CaseStudyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const study = caseStudies.find((c) => c.slug === slug);

  if (!study) return <NotFound />;

  const related = caseStudies.filter((c) => c.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-16">
        <button
          type="button"
          onClick={() => navigate("/work")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Work
        </button>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_240px] gap-10 xl:gap-14 items-start">
          {/* Main content */}
          <div className="min-w-0 max-w-3xl">
            <motion.header
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-8"
            >
              <div className="flex gap-4 items-start">
                {/* Small cover thumb */}
                <div className="relative h-20 w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted mt-1">
                  <img
                    src={study.coverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary mb-2">
                    {study.category}
                    <span className="text-muted-foreground"> · {study.industry}</span>
                  </p>
                  <h1 className="text-[36px] font-extrabold leading-[1.15] text-foreground mb-2 text-balance">
                    {study.client}
                  </h1>
                  <p className="text-base font-medium text-foreground/80 mb-3">{study.tagline}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {study.duration}
                    </span>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {study.year}
                    </span>
                  </div>
                </div>
              </div>
            </motion.header>

            {/* Results — content first */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {study.results.map((r) => (
                <div
                  key={r.label}
                  className="rounded-xl border border-border bg-background p-3.5 text-center"
                >
                  <p className="text-lg font-extrabold text-primary mb-0.5">{r.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">{r.delta}</p>
                </div>
              ))}
            </div>

            <div className="space-y-7">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">The Challenge</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {study.challenge}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Our Solution</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {study.solution}
                </p>
              </section>

              <blockquote className="rounded-xl border border-border bg-muted/40 p-5 relative">
                <Quote className="absolute top-4 right-4 w-7 h-7 text-primary/15" />
                <p className="text-[15px] leading-relaxed italic text-foreground mb-3 pr-8">
                  {`"${study.testimonial.quote}"`}
                </p>
                <div>
                  <p className="font-semibold text-sm">{study.testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{study.testimonial.role}</p>
                </div>
              </blockquote>
            </div>
          </div>

          {/* Sticky rail */}
          <aside className="hidden lg:block sticky top-28 self-start space-y-6">
            <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={study.coverImage}
                alt={`${study.client} project`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Services delivered
              </p>
              <ul className="space-y-2">
                {study.services.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Want results like this?</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Let{"'"}s map clear next steps for your business.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/contact")}
                className="w-full cursor-pointer"
              >
                Book a Free Call
              </Button>
            </div>
          </aside>
        </div>

        {/* Related — compact rows with small thumbs */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">More case studies</h3>
              <button
                type="button"
                onClick={() => navigate("/work")}
                className="text-xs font-semibold text-primary hover:opacity-80 cursor-pointer inline-flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {related.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => navigate(`/work/${c.slug}`)}
                  className="group w-full flex items-center gap-3 p-3.5 text-left bg-background hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <img
                      src={c.coverImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition line-clamp-1">
                      {c.client}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{c.tagline}</p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="lg:hidden mt-10 rounded-xl border border-border p-5">
          <p className="text-sm font-semibold mb-1">Want results like this?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Let{"'"}s map clear next steps for your business.
          </p>
          <Button
            size="sm"
            onClick={() => navigate("/contact")}
            className="w-full cursor-pointer"
          >
            Book a Free Call
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
