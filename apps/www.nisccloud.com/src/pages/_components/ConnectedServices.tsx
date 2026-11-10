import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Homepage productivity partnerships. The nPanel overview now lives in NpanelShowcase. */
export default function ConnectedServices() {
  return (
    <section
      aria-labelledby="partnerships-heading"
      className="py-12 md:py-16"
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[1fr_1.2fr] md:px-8">
        <div>
          <p className="text-sm font-semibold text-primary">
            Cloud productivity partnerships
          </p>
          <h2
            id="partnerships-heading"
            className="mt-2 text-2xl font-bold tracking-tight md:text-3xl"
          >
            The right tools for each team.
          </h2>
        </div>
        <div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/hosting/google-workspace"
              className="rounded-xl border border-border bg-card px-5 py-3 font-semibold hover:border-primary"
            >
              Google Workspace
            </Link>
            <Link
              to="/hosting/microsoft-365"
              className="rounded-xl border border-border bg-card px-5 py-3 font-semibold hover:border-primary"
            >
              Microsoft 365
            </Link>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            As a Microsoft Cloud and Microsoft 365 partner, and a Google
            Workspace partner, Nisc Cloud helps you choose the right
            subscriptions and plan your migration. For mixed teams, combine your
            chosen suite with Nisc Mail on one corporate domain through
            Enterprise Hybrid Email.
          </p>
          <Link
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to="/hosting/hybrid-email"
          >
            Explore Enterprise Hybrid Email{" "}
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs">
              New
            </span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
