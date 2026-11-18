"use client";

import { useEffect, useState } from "react";

const slides = [
  { label: "Create your brand", imageSrc: "/auth/1.png" },
  { label: "Launch online", imageSrc: "/auth/2.png" },
  { label: "Grow your business", imageSrc: "/auth/3.png" },
] as const;

export function AuthRightPanelCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;
  const slide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slideCount]);

  return (
    <section
      className="relative h-full overflow-hidden rounded-3xl bg-[#02070A] text-white"
      aria-label="Nisc Cloud onboarding highlights"
    >
      <div className="pointer-events-none absolute -left-16 top-10 size-56 rounded-full bg-[#38b6ff]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-16 size-48 rounded-full bg-[#FC734D]/20 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between p-8">
        <p className="text-xs font-medium tracking-[0.18em] text-white/70 uppercase">Nisc Cloud</p>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -left-6 top-8 hidden h-40 w-28 rounded-2xl border border-white/10 bg-white/5 xl:block" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 bg-[#38b6ff] shadow-2xl">
            {slides.map((item, idx) => (
              <img
                key={item.imageSrc}
                src={item.imageSrc}
                alt=""
                className={[
                  "absolute inset-0 h-full w-full object-contain transition-opacity duration-700",
                  idx === activeIndex ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-medium tracking-tight">{slide.label}</h2>
            <p className="mt-1 max-w-sm text-sm text-white/70">Domains, hosting, and email from one sign-in.</p>
          </div>
          <div className="flex items-center gap-2">
            {slides.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.imageSrc}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Show slide: ${item.label}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <span
                    className={[
                      "block transition-all duration-300",
                      isActive ? "h-2 w-8 rounded-full bg-white" : "size-2 rounded-full bg-white/35 hover:bg-white/60",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
