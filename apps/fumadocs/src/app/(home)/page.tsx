import Link from "next/link";

const topics = [
  {
    title: "WordPress Hosting",
    description: "Install, manage, and secure WordPress sites on Nisc Cloud.",
    href: "/docs/wordpress",
  },
  {
    title: "Domains",
    description: "Register, transfer, and configure DNS for your domains.",
    href: "/docs/domains",
  },
  {
    title: "Hosting",
    description: "Shared hosting, VPS, VDS, and dedicated server guides.",
    href: "/docs/hosting",
  },
  {
    title: "Business Email",
    description: "Set up mailboxes, DNS records, and email clients.",
    href: "/docs/email",
  },
  {
    title: "SSL Certificates",
    description: "Enable HTTPS and manage SSL certificates.",
    href: "/docs/ssl",
  },
  {
    title: "nPanel",
    description: "Use the Nisc Cloud control panel day to day.",
    href: "/docs/npanel",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16 md:py-24">
      <div className="flex flex-col items-start gap-6">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Nisc Cloud Documentation
          </h1>
          <p className="text-fd-muted-foreground text-lg leading-relaxed">
            Guides and references for WordPress hosting, domains, servers, email,
            SSL, and nPanel. Everything you need to run services on Nisc Cloud.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/docs"
            className="bg-fd-primary text-fd-primary-foreground hover:opacity-90 rounded-md px-4 py-2 text-sm font-medium transition-opacity"
          >
            Browse docs
          </Link>
          <Link
            href="/docs/getting-started"
            className="border-fd-border hover:bg-fd-accent rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Getting started
          </Link>
        </div>
      </div>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            className="border-fd-border hover:border-fd-primary/40 hover:bg-fd-accent/40 rounded-lg border p-5 transition-colors"
          >
            <h2 className="font-semibold tracking-tight">{topic.title}</h2>
            <p className="text-fd-muted-foreground mt-2 text-sm leading-relaxed">
              {topic.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
