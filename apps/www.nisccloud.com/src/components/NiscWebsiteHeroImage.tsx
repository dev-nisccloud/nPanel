import { cn } from "@/lib/utils.ts";

type NiscWebsiteHeroImageProps = {
  src: string;
  alt: string;
  standalone?: boolean;
  className?: string;
  priority?: boolean;
};

/** Above-the-fold service hero image with async decode and no layout-shifting hover effects. */
export function NiscWebsiteHeroImage({
  src,
  alt,
  standalone = false,
  className,
  priority = true,
}: NiscWebsiteHeroImageProps) {
  const shared = {
    src,
    alt,
    decoding: "async" as const,
    loading: (priority ? "eager" : "lazy") as "eager" | "lazy",
    fetchPriority: (priority ? "high" : "low") as "high" | "low",
  };

  if (standalone) {
    return (
      <img
        {...shared}
        width={960}
        height={720}
        className={cn(
          "h-auto max-h-[min(70vh,560px)] w-full object-contain rounded-2xl md:rounded-3xl",
          className,
        )}
      />
    );
  }

  return (
    <img
      {...shared}
      width={960}
      height={560}
      className={cn("h-72 w-full object-cover md:h-96 lg:h-[420px]", className)}
    />
  );
}

/** Lazy-loaded image for below-the-fold marketing blocks. */
export function NiscWebsiteFeatureImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={900}
      height={675}
      decoding="async"
      loading="lazy"
      fetchPriority="low"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
