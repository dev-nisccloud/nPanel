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
    bestFor: "A first store",
    chooseIf: "you have up to 50 products and need mobile money, card checkout, order management and a mobile storefront.",
  },
  {
    name: "Growth",
    level: 2,
    bestFor: "A catalogue your team runs",
    chooseIf: "you need product variants, delivery rules and handover training, with the catalogue size agreed in the proposal.",
  },
  {
    name: "Corporate",
    level: 3,
    bestFor: "A larger operation",
    chooseIf: "you need a full catalogue, abandoned-cart emails, or a marketplace or accounting integration named in the proposal.",
  },
];

export function EcommercePlanFit() {
  return (
    <ContentBand
      id="which-store-plan"
      label="Choosing a package"
      title="Which store package fits?"
      answer="Small Business covers a first store of up to 50 products. Growth adds variants and delivery rules your team runs. Corporate is for a full catalogue and the integrations named in the proposal."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=E-commerce%20store"
        note={
          <>
            <span className="font-semibold">The price is fixed in the proposal.</span> You pay 50% to start and 50% at launch.
            Hosting and payment-provider fees are separate.
          </>
        }
      />
    </ContentBand>
  );
}

export function EcommerceComparison() {
  return (
    <ContentBand
      id="compare-store"
      tone="muted"
      label="Compare"
      title="A store, a website, or hosting?"
      answer="An e-commerce project builds a store with a catalogue and checkout. Website design builds a site around enquiries. Web hosting keeps a site you already have online."
    >
      <ComparisonTable
        caption="Comparison of an e-commerce store, website design and web hosting"
        highlight={0}
        links
        columns={[
          { title: "E-commerce store", href: "#plans" },
          { title: "Website design", href: "/services/website-design" },
          { title: "Web hosting", href: "/hosting/web-hosting" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Selling from a catalogue with checkout and order management",
              "Helping people find you, trust you and get in touch",
              "Putting a website you already have on Nisc Cloud",
            ],
          },
          {
            label: "What you get",
            cells: [
              "Product browsing, checkout and the payment providers agreed for the project",
              "Custom pages, a mobile-first build, enquiry paths and an on-page SEO foundation",
              "Hosting for the site, with email on your domain and management in nPanel",
            ],
          },
          {
            label: "After launch",
            cells: [
              "Your team manages products and orders, with training for the workflows in scope",
              "A handover for the parts in scope. A CMS build can include editor access",
              "You manage the site from the hosting plan",
            ],
          },
          {
            label: "Payments",
            cells: [
              "Set up with your chosen gateway. Provider fees stay with that provider",
              "Enquiry forms and WhatsApp. No checkout unless you add a store",
              "Not included. The site you bring keeps its own payments",
            ],
          },
        ]}
      />
      <RelatedLinks
        className="mt-6"
        links={[
          { label: "Website design", href: "/services/website-design" },
          { label: "Web hosting", href: "/hosting/web-hosting" },
        ]}
      />
    </ContentBand>
  );
}

export function EcommerceStart() {
  return (
    <ContentBand
      id="start-a-store"
      label="Starting a project"
      title="How a store project starts"
      answer="We review the catalogue and how orders are fulfilled, agree the scope, build the store, then launch and train your team. You pay 50% to start and 50% at launch."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <StepList
          steps={[
            "Tell us what you sell, who buys it, and how an order is packed and delivered.",
            "We agree the catalogue, payment providers, delivery rules and what is out of scope.",
            "You approve the proposal. Work starts after the 50% deposit.",
            "We build the storefront and test the path from product to a confirmed order.",
            "We launch and train your team on products, orders and the limits of each provider.",
          ]}
        />
        <div className="rounded-3xl border border-border bg-card p-7">
          <h3 className="type-h3">What to have ready</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            <li>A product list, even if it is still a spreadsheet</li>
            <li>Who supplies product photos, or the photography add-on if you want us to shoot them</li>
            <li>The payment account you want customers to pay into</li>
            <li>Who owns the domain, and how delivery zones should work</li>
          </ul>
        </div>
      </div>
    </ContentBand>
  );
}

export function EcommerceExplained() {
  return (
    <ContentBand
      id="store-explained"
      tone="muted"
      label="E-commerce explained"
      title="What is an e-commerce store?"
      answer="It is a website with a catalogue, a checkout and a place for your team to manage products and orders after launch."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "The store is planned around how a customer finds a product, chooses it and pays, and around how your team then fulfils that order. Payment methods, delivery rules and stock behaviour are agreed before the build.",
              "Card details and settlement stay with the payment provider you choose. We configure the methods that provider and your merchant account allow. Hosting is priced on its own.",
            ]}
          />
          <div>
            <h3 className="type-h3">How do you pay for a store?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              The project price is fixed in the proposal. You pay 50% to start and 50% at launch. There is no hourly billing.
            </p>
            <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-muted-foreground md:text-[17px]">
              Express mobile checkout setup, monthly store maintenance and product photography are optional and quoted separately. Hosting and payment-provider fees are separate.
            </p>
          </div>
        </div>
        <Glossary
          items={[
            { term: "Catalogue", desc: "The products, variants and categories the store is built to sell." },
            { term: "Checkout", desc: "The steps from basket to a confirmed order, including the payment methods in scope." },
            { term: "Payment gateway", desc: "The provider that takes the payment. Its fees, settlement time and available methods are its own." },
            { term: "Handover", desc: "Training on the product, order and reporting workflows included in the proposal." },
          ]}
        />
      </div>
    </ContentBand>
  );
}
