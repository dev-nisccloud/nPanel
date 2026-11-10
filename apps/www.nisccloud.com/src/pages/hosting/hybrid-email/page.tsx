import { ServiceExperience } from "@/pages/_components/ServiceExperience";
import { Link } from "react-router-dom";
import { Mail, Network, Users, ArrowRight, Check } from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

export default function HybridEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-32 md:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium">
              New · Enterprise Hybrid Email Solutions
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
              One corporate domain.
              {" "}<br />
              <span className="text-primary">
                The right email for every role.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Run Google Workspace or Microsoft 365 alongside Nisc Mail on
              @yourcompany.com. Give specialist teams the cloud suites they need
              and equip the rest of your organisation with professional business
              email.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-6 py-3 font-semibold text-primary-foreground"
                to="/contact?service=launch&serviceName=Enterprise%20Hybrid%20Email"
              >
                Get an annual quotation
              </Link>
              <a
                className="rounded-full border border-border px-6 py-3 font-semibold"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              We review your actual licence mix, collaboration needs and migration scope before presenting a tailored annual quotation. Lower cost is possible, but not assumed.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
              <Network className="text-primary" />
              <span className="font-semibold">@yourcompany.com</span>
            </div>
            <div className="space-y-3">
              {[
                [
                  "Google Workspace",
                  "Teams that need Google's productivity suite",
                ],
                [
                  "Microsoft 365",
                  "Teams that need Microsoft's productivity suite",
                ],
                [
                  "Nisc Mail",
                  "Professional email for operational and wider teams",
                ],
              ].map(([name, text]) => (
                <div
                  key={name}
                  className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4"
                >
                  <Mail className="mt-1 shrink-0 text-primary" />
                  <div>
                    <h2 className="font-semibold">{name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Choose Google Workspace or Microsoft 365 as your cloud suite. We
              scope mail routing and migration around your organisation.
            </p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:px-8"><ServiceExperience mode="collaboration" photo/><div><h2 className="text-3xl font-semibold">Keep the tools people use. Reduce the licences they do not need.</h2><p className="mt-5 leading-relaxed text-muted-foreground">Users who rely on shared documents, meetings and suite-specific collaboration remain on Google Workspace or Microsoft 365. Users who primarily send and receive email move to Nisc Mail. Both groups keep addresses on the same company domain, with routing and migration configured for the agreed setup.</p><div className="mt-6 flex flex-wrap gap-4"><Link to="/hosting/email" className="underline">Explore Nisc Mail</Link><Link to="/hosting/microsoft-365" className="underline">Microsoft 365</Link><Link to="/hosting/google-workspace" className="underline">Google Workspace</Link></div></div></section>
        <section
          id="how-it-works"
          className="border-y border-border bg-muted/30 py-16"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="text-3xl font-bold">
              Designed around your workforce.
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                [
                  Users,
                  "Map your teams",
                  "Identify who needs premium collaboration tools and who primarily needs email.",
                ],
                [
                  Network,
                  "Plan the connection",
                  "Define mailbox allocation, internal routing, migration and support responsibilities.",
                ],
                [
                  Check,
                  "Agree your annual cost",
                  "Review licences, Nisc Mail capacity and implementation costs in one tailored quotation.",
                ],
              ].map(([Icon, title, body]) => {
                const I = Icon as typeof Users;
                return (
                  <article
                    key={String(title)}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <I className="mb-4 text-primary" />
                    <h3 className="text-lg font-semibold">{String(title)}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {String(body)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-sm font-semibold text-primary">
            Cloud productivity options
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Google Workspace. Microsoft 365. Nisc Mail.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Choose the suite and mailbox configuration that fits each team.
            Your proposal identifies the products, licence terms, routing,
            migration responsibilities and support services included.
          </p>
          <Link
            to="/contact?service=launch&serviceName=Enterprise%20Hybrid%20Email"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-primary"
          >
            Plan your email setup <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
