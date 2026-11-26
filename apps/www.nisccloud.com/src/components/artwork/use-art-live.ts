import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/** True while the artwork is on screen and the visitor allows motion. */
export function useArtLive<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduceMotion = useReducedMotion() ?? false;
  return { ref, live: inView && !reduceMotion };
}
