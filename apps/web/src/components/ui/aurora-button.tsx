"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface AuroraGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  glowClassName?: string;
  children: React.ReactNode;
}

/** Wraps any control (e.g. shadcn Button) with an animated aurora halo. */
export const AuroraGlow = React.forwardRef<HTMLDivElement, AuroraGlowProps>(
  function AuroraGlow({ className, glowClassName, children, ...props }, ref) {
    return (
      <div ref={ref} className={cn("group relative", className)} {...props}>
        <div
          className={cn(
            "pointer-events-none absolute -inset-2 rounded-[inherit] bg-gradient-to-r from-primary/50 via-cyan-400/60 to-teal-400/50 opacity-70 blur-xl transition-all duration-500",
            "group-hover:opacity-100 group-hover:blur-2xl",
            glowClassName
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-r from-primary via-cyan-300 to-teal-400 opacity-80 blur-md transition-all duration-500",
            "group-hover:opacity-100 group-hover:blur-lg",
            glowClassName
          )}
          aria-hidden
        />
        {children}
      </div>
    );
  }
);

interface AuroraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  glowClassName?: string;
  wrapperClassName?: string;
}

export function AuroraButton({
  className,
  children,
  glowClassName,
  wrapperClassName,
  ...props
}: AuroraButtonProps) {
  return (
    <AuroraGlow className={wrapperClassName} glowClassName={glowClassName}>
      <button
        type="button"
        className={cn(
          "relative rounded-lg bg-slate-950/90 px-4 py-2",
          "text-slate-100 shadow-xl",
          "transition-all hover:bg-slate-950/70",
          "border border-slate-800",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </AuroraGlow>
  );
}
