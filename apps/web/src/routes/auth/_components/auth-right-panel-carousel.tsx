"use client";

import { useEffect, useState } from "react";

const slides = [
  { label: "Create Your Brand", imageSrc: "/auth/1.png" },
  { label: "Launch Online", imageSrc: "/auth/2.png" },
  { label: "Grow Your Business", imageSrc: "/auth/3.png" },
] as const;

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
      <div className="absolute inset-0 bg-[#27BBF3]">
        {slides.map((slide, idx) => (
          <div
            key={slide.imageSrc}
            aria-hidden={idx !== activeIndex}
            className={[
              "absolute inset-0 bg-center bg-no-repeat transition-opacity duration-700 ease-out",
              idx === activeIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{
              backgroundImage: `url('${slide.imageSrc}')`,
              backgroundSize: "100% auto",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-16 z-20 flex items-center justify-center px-10">
        <div className="flex items-center gap-2">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.imageSrc}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show slide: ${slide.label}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span
                  className={[
                    "block transition-all duration-300 ease-out",
                    isActive
                      ? "h-2.5 w-8 rounded-full bg-white"
                      : "size-2.5 rounded-full bg-white/40 hover:bg-white/60",
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
