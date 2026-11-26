import type { ReactNode } from "react";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useArtStory, type ArtStoryState } from "../use-art-story.ts";

type StoryShellProps = {
  title: string;
  label: string;
  steps: readonly string[];
  children: (story: ArtStoryState) => ReactNode;
  tone?: "light" | "sky" | "midnight";
  active?: boolean;
  autoPlay?: boolean;
  compact?: boolean;
};

const surfaces = {
  light:
    "border-slate-200/80 bg-[radial-gradient(circle_at_12%_10%,rgba(56,182,255,.20),transparent_32%),linear-gradient(145deg,#f8fbff,#eaf5fb)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_12%_10%,rgba(56,182,255,.18),transparent_32%),linear-gradient(145deg,#101c25,#071119)]",
  sky:
    "border-[#38b6ff]/80 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.72),transparent_28%),linear-gradient(145deg,#dff4ff,#b9e6fa)] dark:border-[#38b6ff]/20 dark:bg-[radial-gradient(circle_at_85%_15%,rgba(56,182,255,.14),transparent_28%),linear-gradient(145deg,#102b3c,#08151e)]",
  midnight:
    "border-[#38b6ff]/40 bg-[radial-gradient(circle_at_80%_8%,rgba(56,182,255,.22),transparent_30%),linear-gradient(145deg,#102433,#041019)]",
};

export function StoryShell({
  title,
  label,
  steps,
  children,
  tone = "light",
  active = true,
  autoPlay = true,
  compact = false,
}: StoryShellProps) {
  const story = useArtStory({ steps: steps.length, active, autoPlay });
  const currentLabel = steps[story.step] ?? steps.at(-1) ?? title;

  return (
    <figure className="mx-auto w-full max-w-[720px]">
      <div
        ref={story.ref}
        aria-label={label}
        className={cn(
          "relative overflow-hidden rounded-[28px] border p-3 shadow-[0_28px_70px_-42px_rgba(14,87,118,.65)] sm:p-6",
          surfaces[tone],
          compact && "sm:p-4",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.22) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 72%)",
          }}
        />
        <div className="relative">{children(story)}</div>
        <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-white/50 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
          {story.reducedMotion ? (
            <span
              role="status"
              aria-label={`${title} story shown without motion`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Check className="size-4" aria-hidden />
            </span>
          ) : (
            <button
              type="button"
              onClick={story.playing ? story.pause : story.complete ? story.replay : story.play}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={story.playing ? `Pause ${title} story` : story.complete ? `Replay ${title} story` : `Play ${title} story`}
            >
              {story.playing ? (
                <Pause className="size-4" aria-hidden />
              ) : story.complete ? (
                <RotateCcw className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[11px] font-semibold text-foreground">{currentLabel}</span>
              <span className="shrink-0 text-[9px] text-muted-foreground">
                {story.step + 1}/{steps.length}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100"
                style={{ width: `${story.progress}%` }}
              />
            </div>
          </div>
          {!story.playing && !story.complete && (
            <button
              type="button"
              onClick={story.replay}
              className="hidden rounded-lg p-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
              aria-label={`Restart ${title} story`}
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </figure>
  );
}

export function StoryScene({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "col-start-1 row-start-1 grid transition-[opacity,transform] duration-500 [&>*]:col-start-1 [&>*]:row-start-1",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        className,
      )}
      aria-hidden={!show}
    >
      {children}
    </div>
  );
}
