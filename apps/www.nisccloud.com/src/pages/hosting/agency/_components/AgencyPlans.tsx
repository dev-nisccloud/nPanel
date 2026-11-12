import { Link } from "react-router-dom";

const options = [
  {
    name: "Launch your portfolio",
    description:
      "For independent designers and agencies bringing their first client websites together.",
    points: [
      "Review your websites and domains",
      "Agree storage and resource requirements",
      "Plan migration and account ownership",
    ],
  },
  {
    name: "Grow your agency",
    description:
      "For teams managing an expanding mix of client websites and online stores.",
    points: [
      "Assess workloads across your portfolio",
      "Define backup and support requirements",
      "Plan capacity and renewal management",
    ],
  },
  {
    name: "Custom infrastructure",
    description:
      "For agencies with demanding applications, larger stores or specialist hosting requirements.",
    points: [
      "Review VPS, VDS or dedicated resources",
      "Agree management responsibilities",
      "Scope monitoring and recovery needs",
    ],
  },
];
export function AgencyPlans() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <h2 className="type-h2">
        Agency hosting plans, shaped around your clients
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Tell us how many websites you manage and what they need. We will propose
        the resources, support scope and pricing before you commit.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {options.map((option) => (
          <article
            key={option.name}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="type-h3">{option.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {option.description}
            </p>
            <ul className="my-6 flex-1 space-y-3 text-sm">
              {option.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              className="rounded-[10px] bg-primary px-5 py-3 text-center font-semibold text-primary-foreground"
              to={`/contact?service=launch&serviceName=Agency%20Hosting&plan=${encodeURIComponent(option.name)}`}
            >
              Request a hosting proposal
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
