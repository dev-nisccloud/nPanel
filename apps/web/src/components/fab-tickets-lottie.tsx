"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import { cn } from "@/lib/utils";

type FabTicketsLottieProps = {
  className?: string;
};

export function FabTicketsLottie({ className }: FabTicketsLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    return () => media.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/tickets.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tickets animation");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) {
    return <span className={cn("block size-20 shrink-0", className)} aria-hidden />;
  }

  return (
    <div
      className={cn(
        "flex size-20 items-center justify-center overflow-hidden",
        className
      )}
      aria-hidden
    >
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        className="size-[6.5rem] shrink-0 pointer-events-none"
      />
    </div>
  );
}
