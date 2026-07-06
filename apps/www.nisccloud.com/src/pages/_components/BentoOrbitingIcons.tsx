import { forwardRef, useRef } from "react";
import { Globe, Server, Sparkles, User, type LucideIcon } from "lucide-react";

import { AnimatedBeam } from "@/components/ui/animated-beam.tsx";
import { cn } from "@/lib/utils.ts";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-10 flex size-10 items-center justify-center rounded-full border-2 border-border bg-background p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
      className,
    )}
  >
    {children}
  </div>
));

Circle.displayName = "Circle";

const services: { Icon: LucideIcon; label: string }[] = [
  { Icon: Globe, label: "Domains" },
  { Icon: Server, label: "Hosting" },
  { Icon: Sparkles, label: "AI" },
];

export default function BentoOrbitingIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);
  const hostingRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  const serviceRefs = [domainRef, hostingRef, aiRef];

  return (
    <div
      ref={containerRef}
      className="relative flex h-[240px] w-full items-center justify-center overflow-hidden"
    >
      <div className="flex size-full max-w-sm flex-row items-stretch justify-between gap-8 px-4">
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Circle ref={userRef}>
            <User className="size-4 text-foreground" strokeWidth={2} />
          </Circle>
          <span className="text-[10px] font-bold text-muted-foreground select-none">You</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-1.5">
          <Circle ref={hubRef} className="size-14 border-primary/30 bg-background p-2">
            <img
              src="/nisciconoriginal.png"
              alt="Nisc Cloud"
              className="size-full object-contain"
            />
          </Circle>
          <span className="text-[10px] font-bold text-primary select-none whitespace-nowrap">Nisc Cloud</span>
        </div>

        <div className="flex flex-col justify-center gap-4">
          {services.map(({ Icon, label }, index) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Circle ref={serviceRefs[index]} aria-label={label}>
                <Icon className="size-4 text-primary" />
              </Circle>
              <span className="text-[9px] font-bold text-muted-foreground select-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {serviceRefs.map((serviceRef, index) => (
        <AnimatedBeam
          key={services[index].label}
          containerRef={containerRef}
          fromRef={serviceRef}
          toRef={hubRef}
          duration={3}
          delay={index * 0.15}
          gradientStartColor="#38b6ff"
          gradientStopColor="#6366f1"
        />
      ))}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={hubRef}
        toRef={userRef}
        duration={3}
        gradientStartColor="#38b6ff"
        gradientStopColor="#6366f1"
      />
    </div>
  );
}
