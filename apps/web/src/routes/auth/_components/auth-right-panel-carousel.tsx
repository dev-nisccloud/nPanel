"use client";

import { useEffect, useState } from "react";

const slides = [
  { label: "Create your brand", imageSrc: "/auth/1.png" },
  { label: "Grow your business", imageSrc: "/auth/2.png" },
  { label: "Launch online", imageSrc: "/auth/3.png" },
] as const;

export function AuthRightPanelCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 6500);

    return () => window.clearInterval(id);
  }, [slideCount]);

  return (
    <section
      className="relative h-full overflow-hidden rounded-3xl bg-primary"
      aria-label="Nisc Cloud onboarding highlights"
    >
      {slides.map((slide, idx) => (
        <img
          key={slide.imageSrc}
          src={slide.imageSrc}
          alt=""
          className={[
            "absolute inset-0 h-full w-full object-contain transition-opacity duration-700",
            idx === activeIndex ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ))}

      <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center">
        <div className="flex items-center">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.imageSrc}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show slide: ${slide.label}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
              >
                <span
                  className={[
                    "block transition-all duration-300",
                    isActive ? "h-2.5 w-8 rounded-full bg-primary-foreground" : "size-2.5 rounded-full bg-primary-foreground/45",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
