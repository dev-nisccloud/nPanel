import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { WorkProject } from "@/lib/work-projects.ts";

export function ProjectCard({ project, priority = false }: { project: WorkProject; priority?: boolean }) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
      <div
        className={cn(
          "flex items-center justify-center",
          project.frame === "mockup" ? "bg-[#02070A]" : "bg-muted",
        )}
      >
        <img
          src={project.image}
          alt={project.imageAlt}
          className="h-auto w-full"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <h4 className="type-h3 text-balance">{project.client}</h4>
        <p className="type-label mt-2 text-muted-foreground">{project.job}</p>
        <div className="mt-4 space-y-3">
          {project.paragraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
        {project.links.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 self-start rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {link.label}
                <ArrowUpRight className="size-4" aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
