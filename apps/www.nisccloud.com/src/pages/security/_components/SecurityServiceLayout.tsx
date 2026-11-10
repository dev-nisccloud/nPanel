import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd, usePageMeta } from "@/lib/seo.ts";
import { Button } from "@/components/ui/button.tsx";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";

export type SecurityCoverageItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type SecurityServiceLayoutProps = {
  pageTitle: string;
  badge: string;
  title: ReactNode;
  description: string;
  highlights: string[];
  visual: ReactNode;
  contactHref: string;
  ctaLabel: string;
  stepsTitle: string;
  steps: { title: string; desc: string }[];
  coverageTitle: string;
  coverageDescription: string;
  coverage: SecurityCoverageItem[];
  platformsTitle: string;
  platforms: { title: string; points: string[] }[];
  faqs: { question: string; answer: string }[];
  faqTitle: string;
  closingTitle: string;
  closingDescription: string;
};

export default function SecurityServiceLayout({
  pageTitle,
  badge,
  title,
  description,
  highlights,
  visual,
  contactHref,
  ctaLabel,
  stepsTitle,
  steps,
  coverageTitle,
  coverageDescription,
  coverage,
  platformsTitle,
  platforms,
  faqs,
  faqTitle,
  closingTitle,
  closingDescription,
}: SecurityServiceLayoutProps) {

  const { pathname } = useLocation();
  usePageMeta({
    title: pageTitle,
    description,
    canonicalPath: pathname,
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Security", "/security"], [pageTitle, pathname]]),
      serviceJsonLd({ name: pageTitle, description, path: pathname, category: "Website Security" }),
      faqJsonLd(faqs.map((f) => ({ q: f.question, a: f.answer }))),
    ],
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main id="main-content">

      <section className="relative overflow-hidden px-4 pt-28 pb-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-2xl flex-1">
            <span className="text-xs font-semibold text-primary">{badge}</span>
            <h1 className="type-h1 mt-3 mb-5 text-balance">
              {title}
            </h1>
            <p className="mb-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
            <ul className="mb-8 space-y-2">
              {highlights.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild
                className="h-12 cursor-pointer gap-2 rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90"
              ><Link to={contactHref}>
                {ctaLabel} <ArrowRight size={15} />
              </Link></Button>
              <Button
                variant="ghost"
                className="h-12 cursor-pointer rounded-2xl border border-border/60 font-medium hover:border-primary/40 hover:bg-primary/5"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                How it works
              </Button>
            </div>
          </div>
          <div className="w-full flex-1 lg:max-w-[560px]">{visual}</div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border/60 bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="type-h2 mb-10 text-center">{stepsTitle}</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-border bg-card p-6">
                <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="type-h2 mb-3">{coverageTitle}</h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">{coverageDescription}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coverage.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon size={20} />
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="type-h2 mb-8 text-center">{platformsTitle}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {platforms.map((platform) => (
              <div key={platform.title} className="rounded-3xl border border-border bg-card p-7">
                <h3 className="mb-4 text-lg font-bold">{platform.title}</h3>
                <ul className="space-y-2.5">
                  {platform.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm">
                      <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock faqs={faqs} title={faqTitle} />

      <ClosingCta
        eyebrow="Stay protected"
        headline={closingTitle}
        subtext={closingDescription}
        primary={{ label: ctaLabel, href: contactHref }}
        secondary={{ label: "View Security Plans", href: "/security#security-plans" }}
        points={["Setup guidance included", "Pay with M-Pesa or card"]}
        details={{ variant: "shield" }}
      />

      </main>
      <Footer />
    </div>
  );
}
