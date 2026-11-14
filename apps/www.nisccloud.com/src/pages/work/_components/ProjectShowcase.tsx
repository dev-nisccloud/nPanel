import { useMemo, useState } from "react";
import { cn } from "@/lib/utils.ts";
import { WORK_PROJECTS, WORK_SECTORS, type WorkSector } from "@/lib/work-projects.ts";
import { ProjectCard } from "./ProjectCard.tsx";

export default function ProjectShowcase() {
  const [sector, setSector] = useState<WorkSector>("All");
  const visible = useMemo(
    () => (sector === "All" ? WORK_PROJECTS : WORK_PROJECTS.filter((project) => project.sector === sector)),
    [sector],
  );
  const family = sector === "All" ? visible.filter((project) => project.family === "ashut") : [];
  const rest = sector === "All" ? visible.filter((project) => project.family !== "ashut") : visible;

  return (
    <section id="projects" aria-labelledby="work-projects" className="scroll-mt-24 bg-background px-4 pb-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 id="work-projects" className="type-h2 text-balance">
          Eight live sites
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Each card is a site we designed. Seven of them also run on Nisc Cloud hosting. Open the live site to see the work.
        </p>

        <div role="group" aria-label="Filter by sector" className="mt-6 flex flex-wrap gap-2">
          {WORK_SECTORS.map((item) => {
            const selected = item === sector;
            const count = item === "All" ? WORK_PROJECTS.length : WORK_PROJECTS.filter((project) => project.sector === item).length;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setSector(item)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                {item}
                <span className={cn("ml-2 tabular-nums", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {family.length > 0 ? (
          <div className="mt-10">
            <h3 className="type-h3">Ashut brands</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Ashut and Luxewrap share a workshop in Industrial Area. Ashut Plastics is the packaging company. We designed each site and host it.
            </p>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {family.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", family.length > 0 ? "mt-10" : "mt-8")}>
          {rest.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
