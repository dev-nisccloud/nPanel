import { WORK_GROUPS, WORK_PROJECTS } from "@/lib/work-projects.ts";
import { ProjectCard } from "./ProjectCard.tsx";

export default function ProjectShowcase() {
  return (
    <section id="projects" aria-label="Our work" className="scroll-mt-24 bg-background px-4 pb-16 md:px-8">
      <div className="mx-auto max-w-7xl space-y-14">
        {WORK_GROUPS.map((group) => {
          const projects = WORK_PROJECTS.filter((project) => project.group === group.id);
          const creative = group.id === "creative";
          return (
            <div key={group.id}>
              <h2 className="text-2xl font-bold tracking-tight text-primary">{group.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{group.intro}</p>
              <ul className={creative ? "mt-5 flex flex-col gap-5 lg:flex-row lg:items-stretch" : "mt-5 flex flex-col gap-5"}>
                {projects.map((project) => (
                  <li key={project.id} className={creative ? "flex min-w-0 flex-1" : undefined}>
                    <ProjectCard project={project} priority={project.id === "cruises"} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
