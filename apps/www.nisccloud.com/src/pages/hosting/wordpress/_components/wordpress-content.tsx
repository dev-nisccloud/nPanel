import {
  ComparisonTable,
  ContentBand,
  Glossary,
  PlanFitGrid,
  Prose,
  RelatedLinks,
  StepList,
  type PlanFit,
} from "@/pages/_components/ContentBlocks.tsx";

const PLAN_FIT: PlanFit[] = [
  {
    name: "Launch",
    level: 1,
    bestFor: "A first WordPress site or blog",
    chooseIf: "You run one WordPress site and want updates, backups and security handled from day one.",
  },
  {
    name: "Business",
    level: 2,
    bestFor: "Growing business sites and stores",
    chooseIf: "You want a staging copy to test changes, or you run a WooCommerce store.",
    recommended: true,
  },
  {
    name: "Performance",
    level: 3,
    bestFor: "High-traffic sites and many installs",
    chooseIf: "You run several WordPress sites or a busy store, or your team works with Git.",
  },
];

/** Shown straight after the plan cards, while visitors are deciding. */
export function WordPressPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a plan"
      title="Which WordPress plan fits your site?"
      answer="Launch suits a first WordPress site or blog, Business suits growing business sites and WooCommerce stores that need staging, and Performance suits high-traffic sites or several WordPress installs."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=Managed%20WordPress%20Hosting"
        note={
          <>
            <span className="font-semibold">Every plan</span> includes automatic WordPress updates, daily backups,
            DDoS protection, malware scanning and removal, LiteSpeed cache and a free CDN. Business and Performance
            add staging, object cache and WooCommerce-ready setup, and Performance adds Git integration.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown after the showcase, once visitors understand what the plans include. */
export function WordPressComparison() {
  return (
    <ContentBand
      id="compare-hosting"
      tone="muted"
      label="Compare"
      title="Managed WordPress hosting, web hosting or a VPS?"
      answer="Choose managed WordPress hosting when your site runs on WordPress and you want updates, caching, backups and security handled for you. Choose web hosting for other website types, and a VPS when an application needs full control of a server."
    >
      <ComparisonTable
        caption="Comparison of managed WordPress hosting, web hosting and VPS servers"
        highlight={0}
        links
        columns={[
          { title: "Managed WordPress hosting", href: "#plans" },
          { title: "Web Hosting", href: "/hosting/web-hosting" },
          { title: "VPS Servers", href: "/hosting/vps" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "WordPress websites and WooCommerce stores",
              "Business websites, Joomla, custom websites and PHP, Laravel or Node.js applications",
              "Applications and high-traffic sites that need control of the server",
            ],
          },
          {
            label: "Handled for you",
            cells: [
              "Automatic WordPress updates, LiteSpeed cache, daily backups and malware removal",
              "Servers, security, backups and email hosting",
              "Server resources; you manage the software on the server",
            ],
          },
          {
            label: "Developer tools",
            cells: [
              "WP-CLI, SSH and SFTP on every plan; Git integration on Performance",
              "SSH and command-line access",
              "Root access where included in the plan",
            ],
          },
          {
            label: "Testing changes",
            cells: ["Staging environment on Business and Performance", "Choose WordPress hosting when you need staging", "Set up on the server yourself"],
          },
          {
            label: "Email",
            cells: ["Email accounts included", "Email hosting included", "Add Business Email for mailboxes"],
          },
        ]}
      />
      <RelatedLinks className="mt-6" links={[{ label: "Compare all cloud products", href: "/hosting" }]} />
    </ContentBand>
  );
}

/** Shown after the buying steps, for visitors who already run WordPress elsewhere. */
export function WordPressMigration() {
  return (
    <ContentBand
      id="move-your-website"
      label="Already on WordPress?"
      title="How to move your WordPress site to Nisc Cloud"
      answer="Choose a plan, share access to your current site, agree what the move includes, and we copy your files and database to Nisc Cloud free of charge and check the site before your domain is switched."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <StepList
          steps={[
            "Choose the WordPress plan that fits your site.",
            "Share access to your WordPress dashboard and current hosting, and list the plugins and themes you use.",
            "Agree what the migration includes and when the switch should happen, avoiding busy sales periods.",
            "We copy your files and database to your new plan and check pages, forms and checkout.",
            "Your domain is pointed to Nisc Cloud once you are happy with the result.",
          ]}
        />
        <div className="rounded-3xl border border-border bg-card p-7">
          <h3 className="type-h3">What to have ready</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            <li>An administrator login for your WordPress dashboard</li>
            <li>Access to your current hosting control panel or SFTP</li>
            <li>A list of premium plugins and themes; some licences need reactivating after a move</li>
            <li>Access to the account where your domain is registered</li>
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            A content site and an online store have different testing needs. Share your plugins, payment
            integrations and peak periods so the move can be planned around them.
          </p>
          <RelatedLinks
            className="mt-5"
            links={[
              { label: "Transfer Hosting", href: "/hosting/transfer" },
              { label: "Transfer your domain", href: "/domain-transfer" },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}

/** Reference content near the end of the page, for visitors researching before they buy. */
export function WordPressExplained() {
  return (
    <ContentBand
      id="wordpress-hosting-explained"
      tone="muted"
      label="Managed WordPress hosting explained"
      title="What is managed WordPress hosting?"
      answer="Managed WordPress hosting is hosting set up specifically for WordPress, where the provider handles routine work such as WordPress updates, caching, backups and security scanning so you can focus on your website."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "When you compare WordPress hosting, check who handles core updates, plugin compatibility, backups and restores. With Nisc Cloud, automatic WordPress updates, daily backups, malware scanning and removal, LiteSpeed cache and a free CDN are included on every plan.",
              "Hosting and website maintenance cover different responsibilities. If you also want someone to review plugin changes, fix custom code or check the site each month, add a website maintenance agreement.",
            ]}
          />
          <div>
            <h3 className="type-h3">Is managed WordPress hosting right for a WooCommerce store?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              Yes. Business and Performance plans are WooCommerce ready, with object cache and a staging copy to test
              changes before customers see them.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "Start with your site size, expected traffic and how customers pay. A busy store benefits from Performance, while most growing stores start on Business.",
              ]}
            />
            <RelatedLinks
              className="mt-5"
              links={[
                { label: "Website maintenance", href: "/security/website-maintenance" },
                { label: "E-commerce websites", href: "/services/ecommerce" },
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="type-h3 mb-4">WordPress hosting terms explained</h3>
          <Glossary
            items={[
              { term: "Staging", desc: "A private copy of your site where you can test updates and changes before they go live." },
              { term: "LiteSpeed cache", desc: "Server-level caching that stores ready-made pages so WordPress does not rebuild them for every visitor." },
              { term: "Object cache", desc: "Keeps the results of frequent database queries in memory, which helps busy sites and stores respond faster." },
              { term: "CDN", desc: "Servers in several locations that deliver your pages and images from closer to each visitor." },
              { term: "WP-CLI", desc: "The WordPress command line, for managing updates, plugins and users from a terminal." },
              { term: "SFTP", desc: "A secure way to upload and download your site's files." },
              { term: "PHP version", desc: "The version of the language WordPress runs on. Plans offer PHP 8.3, 8.2, 8.1, 8.0 and 7.4." },
              { term: "WooCommerce", desc: "The e-commerce plugin that turns a WordPress site into an online store." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
