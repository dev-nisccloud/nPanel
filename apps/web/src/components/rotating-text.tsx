"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type RotatingTextProps = {
  texts: string[];
  interval?: number;
  className?: string;
};

export function RotatingText({ texts, interval = 3800, className }: RotatingTextProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (texts.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => {
      window.clearInterval(id);
    };
  }, [texts, interval]);

  const current = texts[index] ?? "";

  return (
    <span className={cn("inline-flex relative", className)}>
      <span className="sr-only">{current}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          aria-hidden="true"
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

