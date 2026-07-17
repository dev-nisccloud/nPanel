import { forwardRef, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { AnimatedBeam } from "@/components/ui/animated-beam.tsx";
import { Button } from "@/components/ui/button.tsx";

const pains = [
  { label: "Many bills & vendors", hint: "Too many people to chase" },
  { label: "Nobody owns the fix", hint: "When something breaks" },
  { label: "Inconsistent brand", hint: "Looks different everywhere" },
];

const solutions = [
  { label: "One team, one plan", hint: "One bill. One story." },
  { label: "Clear ownership", hint: "We stay with the outcome" },
  { label: "Brand stays consistent", hint: "Same look, every channel" },
];

const Node = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    tone?: "pain" | "solve" | "center";
    label?: string;
    hint?: string;
    children?: React.ReactNode;
  }
>(({ className, tone = "solve", label, hint, children }, ref) => {
  if (tone === "center") {
    return (
      <div ref={ref} className={cn("relative z-10 flex items-center justify-center", className)}>
        <span className="pointer-events-none absolute inset-0 -m-3 rounded-full bg-primary/20 animate-ping [animation-duration:2.4s]" />
        <span className="pointer-events-none absolute inset-0 -m-6 rounded-full border border-primary/25 animate-ping [animation-duration:2.8s] [animation-delay:0.4s]" />
        <span className="pointer-events-none absolute inset-0 -m-10 rounded-full border border-primary/15 animate-ping [animation-duration:3.2s] [animation-delay:0.8s]" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-white p-4 shadow-[0_8px_30px_-12px_rgba(7,110,255,0.45)] ring-4 ring-primary/15 sm:size-28">
          {children}
        </div>
      </div>
    );
  }

  const isPain = tone === "pain";

  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex w-[150px] flex-col gap-1 rounded-2xl px-3.5 py-3 text-left shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:w-[158px]",
        isPain
          ? "bg-gradient-to-br from-red-50 to-orange-50/80 ring-1 ring-red-200/70"
          : "bg-gradient-to-br from-sky-50 to-blue-50/80 ring-1 ring-primary/20",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
            isPain ? "bg-red-500/15 text-red-500" : "bg-primary/15 text-primary",
          )}
        >
          {isPain ? <X size={11} strokeWidth={2.5} /> : <Check size={11} strokeWidth={2.5} />}
        </span>
        <p className="text-[13px] font-bold leading-snug text-foreground sm:text-sm">{label}</p>
      </div>
      {hint ? (
        <p className="pl-6 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

Node.displayName = "Node";

export default function PainAgitation() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const pain1Ref = useRef<HTMLDivElement>(null);
  const pain2Ref = useRef<HTMLDivElement>(null);
  const pain3Ref = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const solve1Ref = useRef<HTMLDivElement>(null);
  const solve2Ref = useRef<HTMLDivElement>(null);
  const solve3Ref = useRef<HTMLDivElement>(null);

  return (
    <section className="relative overflow-x-hidden py-14 md:py-16">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="mb-3 text-xs font-mono font-bold uppercase tracking-widest text-destructive">
            Sound familiar?
          </p>
          <h2 className="mb-3 text-balance text-3xl font-extrabold tracking-tight md:text-4xl">
            Tired of Paying Separate Teams?
          </h2>
          <p className="text-base text-muted-foreground">
            The mess on the left turns into one clear plan through Nisc Cloud.
          </p>
        </div>

        <div className="mx-auto mb-5 flex max-w-[820px] items-center justify-between px-3 text-[11px] font-bold uppercase tracking-widest">
          <span className="text-red-500/90">With other vendors</span>
          <span className="text-primary">With Nisc Cloud</span>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto flex h-[520px] w-full max-w-[820px] items-center justify-center overflow-visible sm:h-[560px]"
        >
          <div className="grid size-full max-h-[460px] w-full grid-cols-[1fr_auto_1fr] items-center gap-x-16 gap-y-14 sm:gap-x-24 sm:gap-y-16">
            <Node ref={pain1Ref} tone="pain" label={pains[0].label} hint={pains[0].hint} className="justify-self-end" />
            <div />
            <Node ref={solve1Ref} tone="solve" label={solutions[0].label} hint={solutions[0].hint} className="justify-self-start" />

            <Node ref={pain2Ref} tone="pain" label={pains[1].label} hint={pains[1].hint} className="justify-self-end" />
            <Node ref={centerRef} tone="center">
              <img
                src="/nisccloud-logo.svg"
                alt="Nisc Cloud"
                className="h-11 w-auto object-contain sm:h-14"
              />
            </Node>
            <Node ref={solve2Ref} tone="solve" label={solutions[1].label} hint={solutions[1].hint} className="justify-self-start" />

            <Node ref={pain3Ref} tone="pain" label={pains[2].label} hint={pains[2].hint} className="justify-self-end" />
            <div />
            <Node ref={solve3Ref} tone="solve" label={solutions[2].label} hint={solutions[2].hint} className="justify-self-start" />
          </div>

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={pain1Ref}
            toRef={centerRef}
            curvature={-95}
            endYOffset={-12}
            duration={9}
            delay={0.2}
            gradientStartColor="#ef4444"
            gradientStopColor="#f97316"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={pain2Ref}
            toRef={centerRef}
            curvature={-28}
            duration={10}
            delay={0.5}
            gradientStartColor="#ef4444"
            gradientStopColor="#f97316"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={pain3Ref}
            toRef={centerRef}
            curvature={95}
            endYOffset={12}
            duration={9.5}
            delay={0.8}
            gradientStartColor="#ef4444"
            gradientStopColor="#f97316"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={solve1Ref}
            toRef={centerRef}
            curvature={-95}
            endYOffset={-12}
            reverse
            duration={9}
            delay={0.3}
            gradientStartColor="#076EFF"
            gradientStopColor="#4FABFF"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={solve2Ref}
            toRef={centerRef}
            curvature={28}
            reverse
            duration={10}
            delay={0.6}
            gradientStartColor="#076EFF"
            gradientStopColor="#4FABFF"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={solve3Ref}
            toRef={centerRef}
            curvature={95}
            endYOffset={12}
            reverse
            duration={9.5}
            delay={0.9}
            gradientStartColor="#076EFF"
            gradientStopColor="#4FABFF"
          />
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/contact")}
            className="h-12 cursor-pointer gap-2 rounded-full px-8 text-base font-bold"
          >
            Talk to us. It is free.
            <ArrowRight size={16} />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No pressure. We will map a simple plan for your business in about 30 minutes.
          </p>
        </div>
      </div>
    </section>
  );
}
