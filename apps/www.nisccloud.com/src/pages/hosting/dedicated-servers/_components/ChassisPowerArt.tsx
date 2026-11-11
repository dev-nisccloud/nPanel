import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Power } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const BAYS = [0, 1, 2, 3];

/** The visitor presses power once. Drive bays light, then the machine reports online. */
export function ChassisPowerArt() {
  const reduceMotion = useReducedMotion() ?? false;
  const [lit, setLit] = useState(0);
  const started = useRef(false);

  const powerOn = () => {
    if (started.current) return;
    started.current = true;
    if (reduceMotion) {
      setLit(5);
      return;
    }
    [1, 2, 3, 4, 5].forEach((step, i) => {
      window.setTimeout(() => setLit(step), 200 + i * 280);
    });
  };

  const online = lit >= 5;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_30px_60px_-40px_rgb(15_23_42_/_0.35)] sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-medium text-foreground">Your server</p>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {online ? "Online. This machine is yours." : "Powered off"}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
        <ul className="grid flex-1 grid-cols-4 gap-2" aria-hidden>
          {BAYS.map((bay) => (
            <li
              key={bay}
              className={cn(
                "relative h-16 rounded-lg border bg-background transition-colors duration-300",
                lit > bay ? "border-primary bg-primary/15" : "border-border",
              )}
            >
              <span
                className={cn(
                  "absolute bottom-3 left-2 top-3 w-1.5 rounded-full bg-primary transition-opacity duration-300",
                  lit > bay ? "opacity-100" : "opacity-0",
                )}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={powerOn}
          disabled={lit > 0}
          aria-label={online ? "Server is online" : "Power on this server"}
          className={cn(
            "flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default",
            online ? "border-primary bg-primary text-[#02070a]" : "border-border bg-background text-foreground hover:border-primary",
          )}
        >
          <Power className="size-6" aria-hidden />
        </button>
      </div>
      <p className="mt-4 text-base text-muted-foreground">
        {online ? "A physical machine, used only by you." : "A physical machine, used only by you. Press the power button to bring it online."}
      </p>
    </div>
  );
}
