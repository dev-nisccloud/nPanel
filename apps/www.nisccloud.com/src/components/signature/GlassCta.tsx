import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Action = { label: string; to: string };

/**
 * Closing call to action: a contained brand-colour card, the same footprint as the standard closing banner,
 * with the illustration in a frosted glass frame.
 */
export function GlassCta({
  eyebrow,
  title,
  body,
  action,
  secondary,
  art,
  artLabel,
  tone = "blue",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  body: ReactNode;
  action: Action;
  secondary?: Action;
  art: ReactNode;
  artLabel: string;
  tone?: "blue" | "midnight";
  className?: string;
}) {
  const blue = tone === "blue";
  return (
    <section className={cn("px-4 py-14 sm:px-6 md:py-20 lg:px-8", className)}>
      <div
        className={cn(
          "relative mx-auto max-w-7xl overflow-hidden rounded-[28px] shadow-[0_40px_80px_-50px_rgb(2_7_10_/_0.7)]",
          blue ? "bg-[#38b6ff] text-[#02070A]" : "bg-[#02070A] text-white",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[220px] border-l-[220px] border-l-transparent md:border-b-[320px] md:border-l-[320px]",
            blue ? "border-b-[#1aa3e6]" : "border-b-[#38b6ff]/15",
          )}
          aria-hidden
        />
        <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-14 lg:px-14 lg:py-14">
          <div>
            {eyebrow ? <p className={cn("type-label", blue ? "text-[#02070A]/75" : "text-[#38b6ff]")}>{eyebrow}</p> : null}
            <h2 className="type-h2 mt-3 max-w-2xl text-balance">{title}</h2>
            <div className={cn("mt-4 max-w-[60ch] space-y-3 text-base leading-relaxed md:text-lg", blue ? "text-[#02070A]/80" : "text-white/80")}>{body}</div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={action.to}
                className={cn(
                  "group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-bold shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  blue
                    ? "bg-[#02070A] text-white hover:bg-black focus-visible:ring-[#02070A] focus-visible:ring-offset-[#38b6ff]"
                    : "bg-[#38b6ff] text-[#02070A] hover:bg-[#38b6ff]/85 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-[#02070A]",
                )}
              >
                {action.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              {secondary ? (
                <Link
                  to={secondary.to}
                  className={cn(
                    "inline-flex h-12 items-center justify-center rounded-xl border px-6 text-base font-semibold focus-visible:outline-none focus-visible:ring-2",
                    blue ? "border-[#02070A]/25 hover:bg-white/25 focus-visible:ring-[#02070A]" : "border-white/25 hover:bg-white/10 focus-visible:ring-white",
                  )}
                >
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          </div>
          <figure
            role="img"
            aria-label={artLabel}
            className={cn(
              "mx-auto hidden w-full max-w-md rounded-[24px] p-4 shadow-2xl backdrop-blur lg:block",
              blue ? "bg-white/30 ring-1 ring-white/50" : "bg-white/10 ring-1 ring-white/15",
            )}
          >
            {art}
          </figure>
        </div>
      </div>
    </section>
  );
}
