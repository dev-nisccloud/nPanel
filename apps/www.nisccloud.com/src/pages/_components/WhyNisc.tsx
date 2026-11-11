import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  LayoutDashboard,
  Lightbulb,
  Server,
  Sprout,
  Unlock,
} from "lucide-react";

const pillars = [
  {
    icon: Server,
    title: "Infrastructure you can depend on",
    body: "Domains, hosting, business email, servers and SSL from one provider, with plans and renewal terms shown before you buy.",
  },
  {
    icon: LayoutDashboard,
    title: "Control through nPanel",
    body: "Manage your services, users, billing and support requests from one connected workspace.",
  },
  {
    icon: Lightbulb,
    title: "Expertise beyond infrastructure",
    body: "Brand, web, software and marketing specialists who can build on the services you already run.",
  },
  {
    icon: Sprout,
    title: "A partner that grows with you",
    body: "Start with one product today and add services as your business and your customers' needs change.",
  },
] as const;

/** Homepage reasons to choose Nisc Cloud, replacing the earlier “Why Choose Us” grid. */
export default function WhyNisc() {
  return (
    <section
      aria-labelledby="why-heading"
      className="border-y border-border bg-muted/30 py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            id="why-heading"
            className="type-h2 text-balance"
          >
            Built for more than getting online.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Technology, expertise and accountability as your business evolves.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <span className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="type-h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-col divide-y divide-border rounded-3xl border border-border bg-card md:flex-row md:divide-x md:divide-y-0">
          <p className="flex flex-1 items-start gap-3 p-5 text-sm leading-relaxed">
            <Unlock className="mt-0.5 size-5 shrink-0 text-sky-700 dark:text-primary" aria-hidden />
            <span>
              <span className="font-semibold">Your domain, code and data remain yours.</span>{" "}
              <span className="text-muted-foreground">
                Subject to paid invoices and agreed third-party licence terms,
                you can move without losing the assets you own.
              </span>
            </span>
          </p>
          <p className="flex flex-1 items-start gap-3 p-5 text-sm leading-relaxed">
            <CalendarCheck className="mt-0.5 size-5 shrink-0 text-sky-700 dark:text-primary" aria-hidden />
            <span>
              <span className="font-semibold">Milestones agreed up front.</span>{" "}
              <span className="text-muted-foreground">
                For defined managed services, we agree first-month milestones
                during onboarding and review progress within 30 days.
              </span>
            </span>
          </p>
          <Link
            to="/work"
            className="group flex items-center gap-2 p-5 text-sm font-semibold text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:text-primary md:shrink-0"
          >
            See work we have delivered
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
