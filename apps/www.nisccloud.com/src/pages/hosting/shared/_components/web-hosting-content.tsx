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
    bestFor: "A first website or landing page",
    chooseIf: "You are launching one site and want email on your domain from day one.",
  },
  {
    name: "Grow",
    level: 2,
    bestFor: "Small business websites and online stores",
    chooseIf: "Your site takes enquiries or orders, or you expect steady traffic.",
    recommended: true,
  },
  {
    name: "Accelerate",
    level: 3,
    bestFor: "Busier sites and several websites",
    chooseIf: "You run more than one website, or a store with regular visitors.",
  },
  {
    name: "Corporate",
    level: 4,
    bestFor: "Organisations with custom requirements",
    chooseIf: "You need resources, migration or terms set around your organisation.",
  },
];

/** Shown straight after the plan cards, while visitors are deciding. */
export function WebHostingPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a plan"
      title="Which web hosting plan fits your website?"
      answer="Choose by what you are running: Launch for a first website, Grow for small business websites and online stores, Accelerate for busier or multiple sites, and Corporate for custom requirements."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=Web%20Hosting"
        note={
          <>
            <span className="font-semibold">Not sure? Start smaller.</span> You can upgrade from nPanel without
            migrating your website, and the same monthly rate applies whether you pay monthly or for up to three
            years.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown after the showcase, once visitors understand what web hosting includes. */
export function WebHostingComparison() {
  return (
    <ContentBand
      id="compare-hosting"
      tone="muted"
      label="Compare"
      title="Web hosting, WordPress hosting or a VPS: which do you need?"
      answer="Web hosting suits most business websites and applications. Managed WordPress hosting suits WordPress sites where you want updates handled for you. A VPS suits applications and high-traffic sites that need more control over the server."
    >
      <ComparisonTable
        caption="Comparison of web hosting, managed WordPress hosting and VPS servers"
        highlight={0}
        links
        columns={[
          { title: "Web Hosting", href: "#plans" },
          { title: "Managed WordPress Hosting", href: "/hosting/wordpress" },
          { title: "VPS Servers", href: "/hosting/vps" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Business websites, WordPress or Joomla sites, and PHP, Laravel or Node.js applications",
              "WordPress websites where you want updates and backups handled by plan",
              "Applications and high-traffic sites that need more control",
            ],
          },
          {
            label: "Access",
            cells: ["nPanel, plus SSH and command-line access", "nPanel and your WordPress dashboard", "Root access where included in the plan"],
          },
          {
            label: "Email",
            cells: ["Email hosting included", "Add Business Email for mailboxes", "Add Business Email for mailboxes"],
          },
          {
            label: "Security",
            cells: [
              "CDN, DDoS protection, malware and antivirus scanning, daily backups, free SSL",
              "WordPress firewall and malware scanning, backups by plan",
              "Set by the server plan you choose",
            ],
          },
          {
            label: "Growing further",
            cells: ["Upgrade to a larger plan without migrating", "Move to a VPS when the site needs more resources", "Move to VDS or dedicated servers for reserved capacity"],
          },
        ]}
      />
      <RelatedLinks className="mt-6" links={[{ label: "Compare all cloud products", href: "/hosting" }]} />
    </ContentBand>
  );
}

/** Shown after the buying steps, for visitors who already have a website elsewhere. */
export function WebHostingMigration() {
  return (
    <ContentBand
      id="move-your-website"
      label="Already have a website?"
      title="How to move your website to Nisc Cloud"
      answer="Choose a plan, tell us about your current website, agree the migration scope and timing, and we copy and test the site before your domain is switched to Nisc Cloud."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <StepList
          steps={[
            "Choose the web hosting plan that fits your website.",
            "Share details of your current site: files, databases, email accounts and where your domain's DNS is managed.",
            "Agree what the migration includes and when the switch should happen.",
            "We copy the website to your new hosting and check that it works.",
            "Your domain is pointed to Nisc Cloud once you are happy with the result.",
          ]}
        />
        <div className="rounded-3xl border border-border bg-card p-7">
          <h3 className="text-xl font-bold tracking-tight">What to have ready</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            <li>Login details for your current hosting control panel</li>
            <li>Access to the account where your domain is registered</li>
            <li>A list of the mailboxes you use today</li>
            <li>Any times when your website must stay untouched, such as busy sales periods</li>
          </ul>
          <RelatedLinks
            className="mt-6"
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
export function WebHostingExplained() {
  return (
    <ContentBand
      id="web-hosting-explained"
      tone="muted"
      label="Web hosting explained"
      title="What is web hosting?"
      answer="Web hosting is the service that stores your website's files, databases and email on servers connected to the internet, so anyone can open your site by typing your domain name."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "When someone visits your domain, their browser requests your pages from a hosting server. That server needs enough storage, memory and processing capacity to answer quickly, and protection so your site stays available and safe.",
              "With Nisc Cloud, your website and email run on NVMe SSD servers, and you manage everything from nPanel: domains, mailboxes, files, databases, invoices and support requests sit in one account.",
            ]}
          />
          <div>
            <h3 className="text-xl font-bold tracking-tight">How do I pay for web hosting in Kenya?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              Pay by M-Pesa or card. Prices are shown in KES or USD based on your location, excluding VAT.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "You can pay monthly or for one, two or three years at the same monthly rate. New web hosting accounts include a 7-day money-back guarantee, and hosting is run to a 99.9% monthly uptime target, as set out in our Terms of Service.",
                "Need a .co.ke or .ke domain? Nisc Cloud is a KeNIC-accredited registrar, so you can register your domain and host your website in the same account.",
              ]}
            />
            <RelatedLinks
              className="mt-5"
              links={[
                { label: "Search for a domain", href: "/hosting/domains" },
                { label: "Terms of Service", href: "/terms" },
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-xl font-bold tracking-tight">Web hosting terms explained</h3>
          <Glossary
            items={[
              { term: "NVMe SSD", desc: "Fast solid-state storage that reads and writes data quicker than older SSD and hard-drive storage." },
              { term: "CDN", desc: "A content delivery network: servers in several locations that deliver your pages and images from closer to each visitor." },
              { term: "DDoS protection", desc: "Filtering that stops floods of fake traffic from overwhelming your website." },
              { term: "Malware scanning", desc: "Checks for infected or malicious files in your hosting account." },
              { term: "SSL certificate", desc: "Encryption that enables HTTPS, so data sent between visitors and your site is protected." },
              { term: "SSH", desc: "Secure Shell: an encrypted way to connect to your hosting from a terminal and run commands." },
              { term: "Uptime target", desc: "The share of time a service aims to be available. Nisc Cloud runs hosting to a 99.9% monthly target." },
              { term: "Bandwidth", desc: "The amount of data your website can send to visitors each month." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
