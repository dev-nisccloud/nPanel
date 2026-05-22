import { cn } from "@/lib/utils";

/** Small mascot for headings only — no background, no ring */
const MASCOT_CLASS = "h-9 w-9 sm:h-10 sm:w-10 object-contain";

type ZeepoMascotProps = {
  className?: string;
};

export function ZeepoMascot({ className }: ZeepoMascotProps) {
  return (
    <span className="inline-flex shrink-0 bg-transparent">
      <img
        src="/mascot.gif"
        alt=""
        aria-hidden
        className={cn(MASCOT_CLASS, className)}
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
