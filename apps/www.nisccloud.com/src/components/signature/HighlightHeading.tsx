import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

/** Hand-drawn underline that draws itself once the heading scrolls into view. */
export function DrawnUnderline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg className={cn("absolute -bottom-2 left-0 h-3 w-full text-[#fc734d]", className)} viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden>
      <motion.path
        d="M2 9 C 60 2, 140 2, 200 6 S 280 10, 298 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}

/** The highlighted phrase inside a section heading: brand blue with the drawn underline. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block whitespace-nowrap text-[#38b6ff]", className)}>
      {children}
      <DrawnUnderline />
    </span>
  );
}
