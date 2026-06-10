import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Calendar, Quote, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/work")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Studies
          </motion.button>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">
              {study.category}
            </span>
            <span className="text-muted-foreground text-sm">{study.industry}</span>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-3.5 h-3.5" />
              {study.duration}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Calendar className="w-3.5 h-3.5" />
              {study.year}
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold mb-3"
          >
            {study.client}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-xl font-semibold mb-8 ${study.accentColor}`}
          >
            {study.tagline}
          </motion.p>
        </div>

        {/* Cover image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-5xl mx-auto px-6"
        >
          <img
            src={study.coverImage}
            alt={study.client}
            className="w-full rounded-2xl object-cover aspect-video"
          />
          <div className="absolute inset-x-6 bottom-0 h-24 bg-gradient-to-t from-background to-transparent rounded-b-2xl" />
        </motion.div>
      </section>

      {/* Results strip */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {study.results.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className={`text-3xl font-bold mb-1 ${study.accentColor}`}>
                {r.value}
              </p>
              <p className="text-sm text-muted-foreground">{r.label}</p>
              <p className="text-xs text-primary font-semibold mt-1">{r.delta}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Body content */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Main column */}
          <div className="md:col-span-2 space-y-12">
            {/* Challenge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-red-400 rounded-full inline-block" />
                The Challenge
              </h2>
              <p className="text-muted-foreground leading-relaxed">{study.challenge}</p>
            </motion.div>

            {/* Solution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                Our Solution
              </h2>
              <p className="text-muted-foreground leading-relaxed">{study.solution}</p>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden"
            >
              <Quote className="absolute top-4 right-4 w-10 h-10 text-primary/10" />
              <p className="text-lg leading-relaxed italic text-foreground mb-5">
                {`"`}{study.testimonial.quote}{`"`}
              </p>
              <div>
                <p className="font-bold">{study.testimonial.author}</p>
                <p className="text-sm text-muted-foreground">
                  {study.testimonial.role}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Services */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Services Delivered
              </h3>
              <ul className="space-y-2">
                {study.services.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-5"
            >
              <h3 className="font-bold mb-2">Want results like this?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let{"'"}s talk about what the Atom Approach can do for your
                business.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/contact")}
                className="w-full cursor-pointer"
              >
                Book a Free Call
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* More case studies */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">More Case Studies</h3>
            <button
              onClick={() => navigate("/work")}
              className="text-sm text-primary hover:underline cursor-pointer"
            >
              View all →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {caseStudies
              .filter((c) => c.slug !== slug)
              .slice(0, 3)
              .map((c) => (
                <div
                  key={c.slug}
                  onClick={() => navigate(`/work/${c.slug}`)}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 cursor-pointer transition-all"
                >
                  <img
                    src={c.coverImage}
                    alt={c.client}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-3">
                    <p className="font-bold text-sm">{c.client}</p>
                    <p className={`text-xs ${c.accentColor}`}>{c.tagline}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
