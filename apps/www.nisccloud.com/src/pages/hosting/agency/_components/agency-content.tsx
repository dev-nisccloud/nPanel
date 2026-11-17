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
    name: "Launch your portfolio",
    level: 1,
    bestFor: "Your first client websites",
    chooseIf: "you are bringing your first client websites and domains together, and need storage, migration and account ownership agreed.",
  },
  {
    name: "Grow your agency",
    level: 2,
    bestFor: "A growing mix of sites and stores",
    chooseIf: "your team manages an expanding mix of client websites and online stores, and you need workloads, backups, support, capacity and renewals planned.",
  },
  {
    name: "Custom infrastructure",
    level: 3,
    bestFor: "Demanding apps and larger stores",
    chooseIf: "you run demanding applications, larger stores or specialist workloads that may need VPS, VDS or dedicated resources.",
  },
];

/** Shown straight after the three arrangements. */
export function AgencyPlanFit() {
  return (
    <ContentBand
      id="which-arrangement"
      label="Choosing an arrangement"
      title="Which agency hosting arrangement fits?"
      answer="Launch your portfolio brings a first set of client websites together. Grow your agency plans an expanding mix of sites and stores. Custom infrastructure is for demanding applications that may need VPS, VDS or dedicated resources."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?service=launch&serviceName=Agency%20Hosting"
        note={
          <>
            <span className="font-semibold">There is no public price.</span> Tell us how many websites you manage and what they need.
            We propose the resources, support scope and an itemised quote in KES before you commit.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown with the portfolio section, once visitors know what agency hosting covers. */
export function AgencyComparison() {
  return (
    <ContentBand
      id="compare-agency"
      tone="muted"
      label="Compare"
      title="Agency hosting, managed WordPress, or web hosting?"
      answer="Choose agency hosting when you manage several client websites with different needs. Managed WordPress hosting focuses on the WordPress platform. Web hosting is for a website and its email that you run yourself."
    >
      <ComparisonTable
        caption="Comparison of agency hosting, managed WordPress hosting and web hosting"
        highlight={0}
        links
        columns={[
          { title: "Agency hosting", href: "#plans" },
          { title: "Managed WordPress", href: "/hosting/wordpress" },
          { title: "Web hosting", href: "/hosting/web-hosting" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Several client websites with different needs, including WordPress, stores and custom applications",
              "A site that runs on WordPress",
              "A website and its email, hosted together",
            ],
          },
          {
            label: "What is agreed",
            cells: [
              "The portfolio, who has access, who manages updates and support, and a quote before you commit",
              "The WordPress plan, including the updates, caching and security that plan lists",
              "The web hosting plan, managed in nPanel",
            ],
          },
          {
            label: "Moving sites",
            cells: [
              "Platforms, access and site sizes are assessed. The sequence is agreed before any live DNS change",
              "WordPress files and the database are copied after the move is agreed, then checked before the domain is switched",
              "Hosting transfer moves the website after a migration review. Domain transfer is separate",
            ],
          },
          {
            label: "Price",
            cells: [
              "No public price. An itemised quote in KES",
              "Shown on the plan",
              "Shown on the plan",
            ],
          },
        ]}
      />
      <RelatedLinks
        className="mt-6"
        links={[
          { label: "Managed WordPress hosting", href: "/hosting/wordpress" },
          { label: "Web hosting", href: "/hosting/web-hosting" },
          { label: "VPS servers", href: "/hosting/vps" },
        ]}
      />
    </ContentBand>
  );
}

export function AgencyStart() {
  return (
    <ContentBand
      id="start-agency-hosting"
      label="Starting"
      title="How an agency hosting proposal starts"
      answer="Share the websites you manage. We review the portfolio, agree who does what, and plan any move before DNS changes. You get an itemised quote in KES before you commit."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <StepList
          steps={[
            "Tell us how many websites you manage, what they run on, and where growth is coming from.",
            "We review the websites, domains, workloads and the storage and resources they need.",
            "We agree who manages updates, content and support, and who owns each account.",
            "If sites are moving, we define the sequence before any live DNS change.",
            "You receive a proposal with the resources, support scope and an itemised quote in KES.",
          ]}
        />
        <div className="rounded-3xl border border-border bg-card p-7">
          <h3 className="type-h3">What to have ready</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            <li>A list of the websites, and whether each is WordPress, a store or a custom application</li>
            <li>Current hosting access and approximate site sizes, if you want sites moved</li>
            <li>Who should own each client account</li>
            <li>What you expect from backups, restoration and support</li>
          </ul>
        </div>
      </div>
    </ContentBand>
  );
}

export function AgencyExplained() {
  return (
    <ContentBand
      id="agency-hosting-explained"
      tone="muted"
      label="Agency hosting explained"
      title="What is agency hosting?"
      answer="It is a hosting arrangement for designers, developers and agencies that manage client websites. The differences that matter are the portfolio, who has access, who supports what, and how much capacity you need."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "Launching a client website is only the beginning. Renewals, resource needs and technical support continue through the relationship. Agency hosting plans those responsibilities across the websites you manage, with the arrangement matched to that portfolio.",
              "Your portfolio sits in nPanel, organised by client. Account managers see what each client has. Where the plan includes servers, developers can work on them from a browser terminal in nPanel.",
            ]}
          />
          <div>
            <h3 className="type-h3">Is this reseller hosting?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              Not necessarily. Reseller hosting usually includes selling hosting accounts under an agreed arrangement.
            </p>
            <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-muted-foreground md:text-[17px]">
              Tell us about billing, branding and client access. The proposal states what is included. There is no public price: the quote is itemised in KES before you commit.
            </p>
          </div>
        </div>
        <Glossary
          items={[
            { term: "Portfolio", desc: "The client websites, stores and applications the arrangement is planned around." },
            { term: "Client organisation", desc: "How one client's services are grouped in nPanel, so you can switch between clients." },
            { term: "Migration", desc: "A planned move. The sequence is agreed before any live DNS change." },
            { term: "Reseller hosting", desc: "An arrangement that usually includes selling hosting accounts. Agency hosting is not automatically that." },
          ]}
        />
      </div>
    </ContentBand>
  );
}
