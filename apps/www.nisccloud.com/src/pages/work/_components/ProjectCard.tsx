import { cn } from "@/lib/utils.ts";
import type { WorkProject, WorkReel } from "@/lib/work-projects.ts";

function Reel({ reel }: { reel: WorkReel }) {
  return (
    <iframe
      title={reel.title}
      src={`https://www.instagram.com/reel/${reel.id}/embed`}
      className="h-[28rem] w-[17.5rem] max-w-full rounded-xl border border-border bg-card"
      scrolling="no"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

export function ProjectCard({ project, priority = false }: { project: WorkProject; priority?: boolean }) {
  const poster = project.poster === true;
  return (
    <article
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border bg-card",
        poster ? "flex h-full flex-col" : "grid items-center",
        !poster && (project.reels ? "lg:grid-cols-[auto_minmax(0,1fr)]" : "md:grid-cols-2"),
      )}
    >
      {project.reels ? (
        <div className="flex flex-wrap justify-center gap-3 p-4 md:justify-end md:p-5">
          {project.reels.map((reel) => (
            <Reel key={reel.id} reel={reel} />
          ))}
        </div>
      ) : (
        <div className={cn("w-full", poster && "mx-auto max-w-[20rem] px-4 pt-4")}>
          <img
            src={project.image}
            alt={project.imageAlt ?? ""}
            className={cn(
              "w-full object-cover",
              poster ? "aspect-[4/5] rounded-xl" : "aspect-[3/2]",
            )}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
      )}
      <div className={cn("flex flex-col p-6 md:p-8", poster ? "flex-1" : "justify-center")}>
        <h3 className="type-h3 text-balance">{project.client}</h3>
        <p className="type-label mt-2 text-muted-foreground">{project.job}</p>
        <div className="mt-4 space-y-3">
          {project.paragraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
