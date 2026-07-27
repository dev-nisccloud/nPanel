import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowButtonProps {
  text?: string;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  /**
   * "filled"   solid primary resting, secondary/accent circle on hover (Get Started)
   * "outline"  transparent resting, primary circle on hover              (Login)
   */
  variant?: "filled" | "outline";
  /** Pass `null` to hide icons entirely. Defaults to ArrowRight. */
  icon?: LucideIcon | null;
}

export function FlowButton({
  text = "Get Started",
  onClick,
  className,
  size = "md",
  variant = "outline",
  icon = ArrowRight,
}: FlowButtonProps) {
  const isFilled = variant === "filled";
  const Icon = icon ?? null;
  const showIcon = Icon != null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center overflow-hidden cursor-pointer font-semibold",
        "transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:rounded-xl active:scale-[0.97]",
        size === "sm" ? "rounded-full px-8 py-2 text-sm" : "rounded-full px-10 py-2.5 text-[15px]",
        isFilled
          ? "bg-primary text-primary-foreground border border-transparent hover:text-secondary-foreground"
          : "bg-transparent text-foreground border border-border/60 hover:border-transparent hover:text-primary-foreground",
        className,
      )}
    >
      {/* Leading icon  slides in from off-screen left */}
      {showIcon && (
        <Icon
          className="absolute w-4 h-4 left-[-25%] z-[9] stroke-current
            group-hover:left-5
            transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        />
      )}

      {/* Text */}
      <span
        className={cn(
          "relative z-[1] transition-all duration-[800ms] ease-out",
          showIcon
            ? "-translate-x-2 group-hover:translate-x-4"
            : "translate-x-0",
        )}
      >
        {text}
      </span>

      {/* Expanding circle */}
      <span
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-4 rounded-full opacity-0",
          "group-hover:w-[280px] group-hover:h-[280px] group-hover:opacity-100",
          "transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]",
          isFilled ? "bg-secondary" : "bg-primary",
        )}
      />

      {/* Trailing icon  slides out off-screen right */}
      {showIcon && (
        <Icon
          className="absolute w-4 h-4 right-5 z-[9] stroke-current
            group-hover:right-[-25%]
            transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        />
      )}
    </button>
  );
}
