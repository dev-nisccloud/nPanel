import { WORK_GROUPS, WORK_PROJECTS } from "@/lib/work-projects.ts";
import { ProjectCard } from "./ProjectCard.tsx";

export default function ProjectShowcase() {
  return (
    <section id="projects" aria-labelledby="work-projects" className="scroll-mt-24 bg-background px-4 pb-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 id="work-projects" className="type-h2 text-balance">
          Selected work
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Websites, video and campaign creative. Open a live site, or watch a film.
        </p>

        <div className="mt-12 space-y-14">
          {WORK_GROUPS.map((group) => {
            const projects = WORK_PROJECTS.filter((project) => project.group === group.id);
            return (
              <div key={group.id}>
                <h3 className="type-h3">{group.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{group.intro}</p>
                <ul className="mt-5 flex flex-col gap-5">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <ProjectCard project={project} priority={project.id === "cruises"} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
