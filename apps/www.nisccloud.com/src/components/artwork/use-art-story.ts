import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useInView, useReducedMotion } from "motion/react";

type ArtStoryOptions = {
  duration?: number;
  steps: number;
  active?: boolean;
  autoPlay?: boolean;
};

export type ArtStoryState = {
  ref: RefObject<HTMLDivElement | null>;
  step: number;
  progress: number;
  playing: boolean;
  complete: boolean;
  reducedMotion: boolean;
  play: () => void;
  pause: () => void;
  replay: () => void;
};

/** A deterministic, visibility-aware timeline shared by the nPanel stories. */
export function useArtStory({
  duration = 8000,
  steps,
  active = true,
  autoPlay = true,
}: ArtStoryOptions): ArtStoryState {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25 });
  const reducedMotion = useReducedMotion() ?? false;
  const [elapsed, setElapsed] = useState(reducedMotion ? duration : 0);
  const [playing, setPlaying] = useState(autoPlay && !reducedMotion);
  const [documentVisible, setDocumentVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    setElapsed(duration);
    setPlaying(false);
  }, [duration, reducedMotion]);

  useEffect(() => {
    if (!active || !inView || !documentVisible || !playing || reducedMotion) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setElapsed((current) => {
        const next = Math.min(duration, current + delta);
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [active, documentVisible, duration, inView, playing, reducedMotion]);

  const play = useCallback(() => {
    if (reducedMotion) return;
    setElapsed((current) => (current >= duration ? 0 : current));
    setPlaying(true);
  }, [duration, reducedMotion]);

  const pause = useCallback(() => setPlaying(false), []);
  const replay = useCallback(() => {
    if (reducedMotion) return;
    setElapsed(0);
    setPlaying(true);
  }, [reducedMotion]);

  const complete = elapsed >= duration;
  const progress = Math.min(100, (elapsed / duration) * 100);
  const step = reducedMotion
    ? steps - 1
    : Math.min(steps - 1, Math.floor((elapsed / duration) * steps));

  return {
    ref,
    step,
    progress,
    playing,
    complete,
    reducedMotion,
    play,
    pause,
    replay,
  };
}
