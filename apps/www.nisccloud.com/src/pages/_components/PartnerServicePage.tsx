import { Link } from "react-router-dom";
import ServicePageShell from "./ServicePageShell";
import { ServiceExperience } from "./ServiceExperience";
import { LicencePlansSection } from "./LicencePlansSection.tsx";

const offerings = {
  "microsoft-365": {
    title: "Microsoft 365",
    headline: "Microsoft 365 for the way your team works",
    desc: "Plan business email, productivity apps and collaboration tools around the work each team member needs to do. Your quotation confirms the exact licences and Nisc Cloud services included.",
    items: [
      ["Email and productivity", "Discuss business email with Outlook and Exchange, plus the Word, Excel and PowerPoint access your team needs. App availability depends on the selected licence."],
      ["Files and teamwork", "Plan OneDrive and SharePoint access, sharing permissions and collaboration. Confirm whether your chosen licence includes Teams before ordering."],
      ["Migration and onboarding", "Review your existing tenant, mailboxes and devices. Agree the migration scope, responsibilities and launch sequence before making changes."],
    ],
    faq: "Microsoft 365 has different licence options. Desktop apps, Teams, security capabilities and AI features vary by plan. Your proposal identifies the exact licence and any additional services.",
  },
  "google-workspace": {
    title: "Google Workspace",
    headline: "Google Workspace for connected teams",
    desc: "Plan business Gmail, documents, meetings and shared files around your users, data and administration needs. Your quotation confirms the selected plan and rollout services.",
    items: [
      ["Gmail on your business domain", "Give your team professional email addresses with Gmail. Plan mailbox migration, domain configuration and account administration together."],
      ["Create and collaborate", "Work with Docs, Sheets and Slides, share files through Drive and meet with Google Meet. Storage and feature limits depend on your selected plan."],
      ["A planned transition", "Start with your users, existing data and access requirements. Agree migration, training and support scope so your team knows what changes and when."],
    ],
    faq: "Google Workspace plans differ in storage, meeting features, administration and AI capabilities. We match current plan options to your requirements and confirm included features in your quotation.",
  },
  transfer: {
    title: "Transfer Hosting",
    headline: "Move your hosting with a clear migration plan",
    desc: "Bring your website to Nisc Cloud with an agreed process for files, databases, domain settings and launch checks. Start with a migration review so we understand your current platform and dependencies.",
    items: [
      ["Review before moving", "Share your website platform, current hosting setup, site size and integrations. We identify compatibility, access and resource requirements before quoting."],
      ["Copy, test and prepare", "Agree backups and a rollback approach. Copy the website into the destination environment and test critical pages, forms and transactions before the switch."],
      ["Switch and verify", "Schedule DNS changes, check the live website and confirm the agreed handover. Email migration and domain registration transfer are separate tasks and will be scoped when needed."],
    ],
    faq: "Transfer hosting moves website files and applications to another hosting environment. Domain transfer changes the registrar managing a domain. DNS settings connect the domain to the selected hosting.",
  },
} as const;

export default function PartnerServicePage({ kind }: { kind: keyof typeof offerings }) {
  const item = offerings[kind];
  const migration = kind === "transfer";
  const contactHref = `/contact?service=launch&serviceName=${encodeURIComponent(item.title)}`;
  const secondaryFaq = migration
    ? {
        q: "What access and preparation will you need?",
        a: "We confirm the hosting control-panel access, website files, database, DNS ownership, backups and maintenance window required before the migration is scheduled.",
      }
    : {
        q: "Can some users stay on their current email platform?",
        a: "We can assess a hybrid email arrangement. Mail routing, licence compatibility, administration and migration must be planned for your organisation.",
      };

  return (
    <ServicePageShell
      badge={item.title}
      headline={item.headline}
      subtext={item.desc}
      serviceType="hosting"
      closingCard={migration ? "brief" : "storefront"}
      plans={[]}
      heroCta2="Discuss your requirements"
      heroCta2Href={contactHref}
      heroIllustration={<ServiceExperience mode={migration ? "migration" : "collaboration"} photo />}
      heroIllustrationBare
      plansUnderHero
      customPlansSection={!migration ? (
        <LicencePlansSection kind={kind as "microsoft-365" | "google-workspace"} />
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <h2 className="text-3xl font-semibold">Get a migration assessment</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Tell us about your current website and hosting. We will confirm the scope, timing and cost before any changes to your live services.
          </p>
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-primary px-6 py-3 font-semibold text-primary-foreground" to={contactHref}>
            Request a proposal
          </Link>
        </section>
      )}
      showcaseBlocks={item.items.map(([headline, body], i) => ({
        headline,
        body,
        bullets: [],
        visual: "default",
        artwork: <ServiceExperience mode={migration ? "migration" : "collaboration"} photo={i === 1} variant={i + 1} />,
      }))}
      faqs={[
        { q: migration ? "Is hosting transfer the same as domain transfer?" : `What is included with ${item.title}?`, a: item.faq },
        secondaryFaq,
      ]}
      ctaHeadline={migration ? "Plan your move to Nisc Cloud" : `Build your ${item.title} plan`}
      ctaSubtext="Discuss your requirements and receive a scoped proposal."
    />
  );
}
