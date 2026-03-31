"use client";

import { useEffect, useState } from "react";

type CarouselSlide = {
  title: string;
  subheading: string;
  description: string;
  imageSrc: string;
  cta: string;
  ctaLink: string;
};

const slides: CarouselSlide[] = [
  {
    title: "Turn Clicks into Customers",
    subheading: "Full-Service Digital Marketing",
    description:
      "We handle SEO, social media, PPC, and web design, so your brand gets found, remembered, and chosen. More visibility. More leads. Less guesswork.",
    imageSrc: "/nisc-bg.svg",
    cta: "Grow My Brand",
    ctaLink: "www.nisccloud.com",
  },
  {
    title: "Your Website, Always On",
    subheading: "Web Hosting · VPS · Email · Domains",
    description:
      "Fast, secure hosting built for businesses that can't afford downtime. One dashboard, one support team, everything your team needs to stay online and productive.",
    imageSrc: "/nisc-bg-1.svg",
    cta: "See Hosting Plans",
    ctaLink: "www.nisccloud.com",
  },
  {
    title: "Launch Fast. Scale Confidently.",
    subheading: "Your All-in-One Growth Partner",
    description:
      "From your first domain to your next campaign, we bring cloud infrastructure and digital strategy under one roof, with real people ready to help when it matters.",
    imageSrc: "/nisc-bg-3.svg",
    cta: "Start Your Journey",
    ctaLink: "www.nisccloud.com",
  },
];

export function AuthRightPanelCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 6500);

    return () => window.clearInterval(id);
  }, [slideCount]);

  return (
    <section className="absolute inset-0 overflow-hidden rounded-3xl" aria-label="Nisc Cloud onboarding highlights">
      {/* Background carousel */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={`${slide.title}-bg`}
            aria-hidden={idx !== activeIndex}
            className={[
              "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-out",
              idx === activeIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ backgroundImage: `url('${slide.imageSrc}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-white/18 to-white/8" />
      </div>

      {/* Bottom content + controls */}
      <div className="absolute inset-x-0 bottom-16 px-10">
        <div className="w-full">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Show slide ${idx + 1}`}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60"
                  >
                    <span
                      className={[
                        "block transition-all duration-300 ease-out",
                        isActive
                          ? "h-2.5 w-8 rounded-full bg-primary"
                          : "size-2.5 rounded-full bg-primary/35 hover:bg-primary/50",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[96px]">
            {slides.map((slide, idx) => {
              const isActive = idx === activeIndex;

              return (
                <div
                  key={slide.title}
                  className={[
                    "absolute inset-0 transition-all duration-500 ease-out",
                    isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
                  ].join(" ")}
                  aria-hidden={!isActive}
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700/90">{slide.subheading}</p>
                    <h2 className="text-2xl font-bold leading-tight text-black">{slide.title}</h2>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{slide.description}</p>
                    <a
                      href={slide.ctaLink.startsWith("http") ? slide.ctaLink : `https://${slide.ctaLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      {slide.cta}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

