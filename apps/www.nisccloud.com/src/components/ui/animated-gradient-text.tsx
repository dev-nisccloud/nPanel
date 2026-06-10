import type { ReactNode } from "react";

import { cn } from "@/lib/utils.ts";

export function AnimatedGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl bg-white/20 px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#8fdfff12] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#8fdfff24] dark:bg-black/20",
        className,
      )}
    >
      <div
        className="absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/28 via-[#9c40ff]/28 to-[#ffaa40]/28 bg-[length:var(--bg-size)_100%] p-px [mask-composite:subtract] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
      />

      {children}
    </div>
  );
}
