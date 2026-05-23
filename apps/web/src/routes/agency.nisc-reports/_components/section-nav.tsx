"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NISC_SECTIONS, type NiscSectionId } from "./utils";

export function SectionNav() {
  const [active, setActive] = React.useState<NiscSectionId>("executive");

  React.useEffect(() => {
    const hash = window.location.hash.replace("#", "") as NiscSectionId;
    if (hash && NISC_SECTIONS.some((s) => s.id === hash)) {
      setActive(hash);
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as NiscSectionId);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const { id } of NISC_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: NiscSectionId) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav className="hidden xl:flex flex-col gap-1 fixed right-6 top-32 z-20 w-36">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
          Jump to
        </p>
        {NISC_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={cn(
              "text-left text-xs px-2 py-1.5 rounded-md transition-colors",
              active === s.id
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="flex xl:hidden gap-1 overflow-x-auto pb-2 -mx-1 px-1 sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-2 mb-2">
        {NISC_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/60"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}
