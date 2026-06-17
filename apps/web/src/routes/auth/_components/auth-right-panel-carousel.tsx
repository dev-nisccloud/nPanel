"use client";

import { useEffect, useState } from "react";

type CarouselSlide = {
  title: string;
  subheading: string;
  description: string;
  imageSrc: string;
};

const slides: CarouselSlide[] = [
  {
    title: "Create Your Brand",
    subheading: "CREATE",
    description:
      "A brand people remember, trust, and choose — built in days, not months. Logo, website, copy, and identity, all done for you.",
    imageSrc: "/create.png",
  },
  {
    title: "Launch Online",
    subheading: "LAUNCH",
    description:
      "Fast, secure, always-on hosting with a domain and business email that screams credibility. Your customers check you out at midnight — we make sure you're ready.",
    imageSrc: "/launch.png",
  },
  {
    title: "Grow Your Business",
    subheading: "GROW",
    description:
      "SEO, ads, and AI automation dialled in to bring real paying customers through your door — and follow up on every lead, 24/7, while you focus on your work.",
    imageSrc: "/grow.png",
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
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{slide.subheading}</p>
                    <h2 className="text-2xl font-bold leading-tight text-black">{slide.title}</h2>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{slide.description}</p>
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
