import { cn } from "@/lib/utils";

/** Small mascot for headings only - no background, no ring */
const MASCOT_SIZE = "h-9 w-9 sm:h-10 sm:w-10";

type ZeepoMascotProps = {
  className?: string;
};

export function ZeepoMascot({ className }: ZeepoMascotProps) {
  return (
    <span className={cn("inline-flex shrink-0 bg-transparent", MASCOT_SIZE, className)}>
      <img
        src="/mascot.gif"
        alt=""
        aria-hidden
        className="h-full w-full object-contain"
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
