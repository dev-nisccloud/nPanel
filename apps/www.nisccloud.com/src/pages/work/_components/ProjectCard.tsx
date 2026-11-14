import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { WorkProject } from "@/lib/work-projects.ts";

export function ProjectCard({ project }: { project: WorkProject }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className={cn("aspect-[16/10]", project.fit === "contain" ? "bg-white p-8" : "bg-muted")}>
        <img
          src={project.image}
          alt=""
          className={cn("h-full w-full", project.fit === "contain" ? "object-contain" : "object-cover object-top")}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="type-label text-muted-foreground">{project.sector}</p>
        <h3 className="type-h3 mt-2 text-balance">{project.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
        <p className="mt-3 text-sm font-semibold text-foreground">{project.role}</p>
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary hover:underline"
        >
          Visit {project.name}
          <ArrowUpRight className="size-4" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
