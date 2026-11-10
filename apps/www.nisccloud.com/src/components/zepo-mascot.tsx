import { cn } from "@/lib/utils.ts";

type ZepoMascotProps = {
  className?: string;
  alt?: string;
  size?: number | string;
  strokeWidth?: number;
};

/** Official Zepo AI mascot supplied by Nisc Cloud. */
export function ZepoMascot({
  className,
  alt = "",
  size,
}: ZepoMascotProps) {
  return (
    <img
      src="/brand/zepo-mascot.png"
      alt={alt}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={cn("shrink-0 object-contain", className)}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}
