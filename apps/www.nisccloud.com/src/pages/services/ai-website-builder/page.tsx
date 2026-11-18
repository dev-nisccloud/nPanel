import { Link } from "react-router-dom";
import { ArrowRight, Globe, Lock, Mail, MessageSquare, PenLine, Server, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import { WebsiteBuilderStory } from "@/components/artwork/npanel-stories/ai-stories.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { breadcrumbJsonLd, faqJsonLd, usePageMeta } from "@/lib/seo.ts";

const PATH = "/services/ai-website-builder";
const NOTIFY_HREF = `/contact?serviceName=${encodeURIComponent("AI website builder")}`;

const STEPS = [
  { icon: PenLine, title: "Describe your business", body: "Tell the AI what you do, who you serve and what you want visitors to do." },
  { icon: LayoutTemplate, title: "Get a first version", body: "It builds the pages, text and layout using your brand colours and logo." },
  { icon: MessageSquare, title: "Change anything", body: "Ask for changes in plain words, or edit the page yourself." },
  { icon: Globe, title: "Connect and publish", body: "Connect your domain and publish on Nisc Cloud hosting from nPanel." },
];

const CONNECTED = [
  { icon: Globe, title: "Your domain", body: "Register a new one or connect the domain you already own." },
  { icon: Server, title: "Nisc Cloud hosting", body: "Your site is published on our hosting, managed in nPanel." },
  { icon: Lock, title: "SSL", body: "The secure padlock that visitors expect." },
  { icon: Mail, title: "Business email", body: "Email on the same domain as your new website." },
];

const FAQS = [
  { q: "When will the AI website builder launch?", a: "We have not set a launch date yet. Leave your details and we will tell you when it is ready." },
  { q: "How much will it cost?", a: "Pricing is not set yet. We will publish it on this page before launch." },
  { q: "I need a website now. What can I do?", a: "Our team designs and builds business websites today. See Website Design for packages, or host a site you already have on Nisc Cloud website hosting." },
  { q: "Will I be able to use my own domain?", a: "Yes. The plan is to connect a domain you own or register a new one, then publish from nPanel." },
];

export default function AiWebsiteBuilderPage() {
  usePageMeta({
    title: "AI website builder (coming soon)",
    description:
      "Describe your business and AI builds your website with your brand. Edit it, connect your domain and publish on Nisc Cloud hosting, all in nPanel. Coming soon.",
    canonicalPath: PATH,
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Business Solutions", "/services"], ["AI website builder", PATH]]),
      faqJsonLd(FAQS),
    ],
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden px-4 pb-16 pt-28 lg:pb-24 lg:pt-36">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,182,255,0.12),transparent_36%)]"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                AI website builder
                <span className="rounded-md bg-brand-orange/20 px-2 py-0.5 text-xs font-semibold text-foreground">Coming soon</span>
              </p>
              <h1 className="type-h1 mt-4 text-balance">
                Describe your business. <span className="text-primary">Get a website.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Tell the AI what you do and it builds a first version of your website with your brand. Change
                anything by asking, connect your domain and publish on Nisc Cloud hosting, all inside nPanel.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/30">
                  <Link to={NOTIFY_HREF}>
                    Tell me when it launches <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-12 rounded-2xl border border-border/60">
                  <Link to="/services/website-design">Need a website now?</Link>
                </Button>
              </div>
            </div>
            <div className="min-w-0">
              <WebsiteBuilderStory />
            </div>
          </div>
        </section>

        <section aria-labelledby="builder-steps-heading" className="border-t border-border px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="type-label text-primary">How it will work</p>
            <h2 id="builder-steps-heading" className="type-h2 mt-3 max-w-2xl">From a few sentences to a live website.</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="rounded-[22px] border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="builder-connected-heading" className="bg-muted/30 px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="type-label text-primary">Connected from day one</p>
              <h2 id="builder-connected-heading" className="type-h2 mt-3">Everything a website needs, in the same account.</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                The builder will sit inside nPanel, next to the domain, hosting and email it needs, so you do
                not set them up in separate places.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {CONNECTED.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4 rounded-[20px] border border-border bg-card p-5">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FaqBlock faqs={FAQS.map((faq) => ({ question: faq.q, answer: faq.a }))} title="Questions about the AI website builder" />

        <ClosingCta
          headline="Be first to build with AI"
          subtext="Leave your details and we will tell you when the AI website builder is ready."
          primary={{ label: "Tell me when it launches", href: NOTIFY_HREF }}
          secondary={{ label: "See Website Design", href: "/services/website-design" }}
          steps={["Leave your details", "We tell you at launch", "Build your site in nPanel"]}
        />
      </main>
      <Footer />
    </div>
  );
}
