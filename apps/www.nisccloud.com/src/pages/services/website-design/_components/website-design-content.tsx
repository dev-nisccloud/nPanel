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
    name: "Small Business",
    level: 1,
    bestFor: "A compact business website",
    chooseIf: "you need up to five pages, a contact form, a WhatsApp button, on-page SEO and an SSL certificate.",
  },
  {
    name: "Growth",
    level: 2,
    bestFor: "A site your team will edit",
    chooseIf: "you need more pages than a compact site and a CMS, with the page count agreed in the proposal.",
  },
  {
    name: "Corporate",
    level: 3,
    bestFor: "A larger organisation",
    chooseIf: "you need a custom design, more than one language, or a full SEO audit and schema markup.",
  },
];

/** Shown straight after the plan cards. */
export function WebsiteDesignPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a plan"
      title="Which website design plan fits?"
      answer="Small Business covers up to five pages. Growth adds a CMS and a broader page set. Corporate is for a custom design, more than one language, and a fuller SEO setup. The proposal confirms the schedule and the price."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=Website%20Design"
        note={
          <>
            <span className="font-semibold">The price is fixed in the proposal.</span> You pay 50% to start and 50% at launch. There is no hourly billing.
            The proposal records deliverables, assumptions, price and an estimated schedule. Changes, delayed content
            or added integrations are agreed separately. Hosting is priced on its own.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown with the build section, once visitors know what the service includes. */
export function WebsiteDesignComparison() {
  return (
    <ContentBand
      id="compare-website"
      tone="muted"
      label="Compare"
      title="A designed website, an online store, or hosting?"
      answer="Website design builds a site around enquiries and trust. An e-commerce project builds a store with a catalogue and checkout. Web hosting keeps a site you already have online."
    >
      <ComparisonTable
        caption="Comparison of website design, an e-commerce store and web hosting"
        highlight={0}
        links
        columns={[
          { title: "Website design", href: "#plans" },
          { title: "E-commerce store", href: "/services/ecommerce" },
          { title: "Web hosting", href: "/hosting/web-hosting" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Helping people find you, trust you and get in touch",
              "Selling from a catalogue with checkout and order management",
              "Putting a website you already have on Nisc Cloud",
            ],
          },
          {
            label: "What you get",
            cells: [
              "Custom pages, a mobile-first build, enquiry paths and an on-page SEO foundation",
              "Product browsing, checkout and the payment providers agreed for the project",
              "Hosting for the site, with email on your domain and management in nPanel",
            ],
          },
          {
            label: "After launch",
            cells: [
              "A handover for the parts in scope. A CMS build can include editor access",
              "Your team manages products and orders",
              "You manage the site from the hosting plan",
            ],
          },
          {
            label: "Search results",
            cells: [
              "Technical foundations only. Rankings are not guaranteed",
              "Set in the store project",
              "Depends on the site you bring",
            ],
          },
        ]}
      />
      <RelatedLinks
        className="mt-6"
        links={[
          { label: "E-commerce store development", href: "/services/ecommerce" },
          { label: "Web hosting", href: "/hosting/web-hosting" },
        ]}
      />
    </ContentBand>
  );
}

/** Shown after the four project steps. */
export function WebsiteDesignStart() {
  return (
    <ContentBand
      id="start-a-website"
      label="Starting a project"
      title="How a website project starts"
      answer="You share the basics of the business, we map the pages and wireframes, you approve the design, and we build, test and hand the site over."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <StepList
          steps={[
            "Tell us what you offer, who it suits, and the next step you want visitors to take.",
            "We agree the pages, content, integrations and approval process, then draw wireframes before design begins.",
            "You approve the visual design before development starts.",
            "We build the approved pages, test representative journeys on mobile, tablet and desktop, and launch after your approval.",
            "We hand over the parts in scope and show your team how to manage them.",
          ]}
        />
        <div className="rounded-3xl border border-border bg-card p-7">
          <h3 className="type-h3">What to have ready</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            <li>Basic information about your business</li>
            <li>Who supplies photography and copy, or the copywriting add-on if you want us to write it</li>
            <li>Who owns the domain and the accounts the site will use</li>
            <li>For a redesign, the existing pages and URLs worth keeping</li>
          </ul>
        </div>
      </div>
    </ContentBand>
  );
}

/** Reference content before the FAQ. Replaces the short decision guide. */
export function WebsiteDesignExplained() {
  return (
    <ContentBand
      id="website-design-explained"
      tone="muted"
      label="Website design explained"
      title="What is website design?"
      answer="It is the work of planning, designing and building a mobile-first website around what visitors need to understand and the next step you want them to take."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "Good website design starts with what visitors need to understand: what you offer, who it suits, what makes it credible and how to take the next step. Those questions shape the pages, navigation and enquiry paths.",
              "On an existing website, useful content and established URLs should be reviewed before a redesign changes the structure. React, WordPress or a headless CMS is chosen during discovery around how you want to edit the site.",
            ]}
          />
          <div>
            <h3 className="type-h3">How do you pay for a website?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              The project price is fixed in the proposal. You pay 50% to start and 50% at launch. There is no hourly billing.
            </p>
            <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-muted-foreground md:text-[17px]">
              Copywriting, a speed and security audit, and monthly maintenance are optional and quoted separately. Hosting is priced on its own.
            </p>
          </div>
        </div>
        <Glossary
          items={[
            { term: "Wireframe", desc: "A map of how every page flows, drawn before visual design begins." },
            { term: "On-page SEO", desc: "Title tags, meta descriptions, heading structure, schema and a sitemap. This helps search engines read the site. It does not guarantee rankings." },
            { term: "CMS", desc: "WordPress or a headless CMS, when you want to edit the site yourself after handover." },
            { term: "Handover", desc: "Launch checks and a walkthrough of the parts included in your plan or proposal." },
            { term: "Proposal", desc: "The record of deliverables, assumptions, price and the estimated schedule before work begins." },
          ]}
        />
      </div>
    </ContentBand>
  );
}
