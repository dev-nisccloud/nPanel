import { useLocation } from "react-router-dom";
const guides: Record<string, string[]> = {
  "website-design": [
    "A business website built around customer decisions",
    "Good website design starts with what visitors need to understand: what you offer, who it suits, what makes it credible and how to take the next step. We use those questions to organise service pages, navigation and enquiry journeys. For an existing website, useful content and established URLs should be reviewed before a redesign changes the structure.",
    "Define the project before design begins",
    "Your brief should identify the pages, content, integrations and approval process. Discuss who supplies photography and copy, who owns the domain and accounts, and what support is needed after launch. This makes the proposal clearer and helps your team plan content, reviews and handover.",
  ],
  seo: [
    "SEO, AEO and GEO: what each addresses",
    "SEO helps people discover relevant pages through search engines. AEO focuses on clear answers to specific questions. GEO considers how your business and its expertise are represented in generative search experiences. They share a foundation: accessible pages, accurate information, useful content and evidence that supports your claims.",
    "Measure business outcomes as well as visibility",
    "Agree the enquiries, sales or other actions that matter before work begins. Review search queries and landing pages alongside conversions, then prioritise pages that match customer intent. Rankings and AI citations vary; progress should be judged using observed results over time rather than promises of a fixed position.",
  ],
  email: [
    "Choosing business email hosting in Kenya",
    "Business email uses your own domain to give customer communication a consistent identity. Before choosing a plan, consider mailbox storage, the number of users, device access and how existing messages will be moved. Email hosting and collaboration suites serve different needs, so compare the tools your team actually uses.",
    "Plan a careful email migration",
    "List your mailboxes, aliases and shared addresses before the move. Confirm access to the domain DNS, review the migration scope and agree when to switch mail delivery. Where teams need different collaboration tools, explore enterprise hybrid email and confirm how mail routing and administration will work.",
  ],
  ecommerce: [
    "Plan the complete buying journey",
    "An e-commerce website should help customers find the right product, understand the total cost and complete an order with confidence. Product information, delivery coverage, payment options and returns guidance all influence that decision. Define these requirements alongside the visual design.",
    "Connect the store to your operations",
    "Discuss stock handling, payment confirmation, order notifications and fulfilment before development begins. Existing accounting or inventory tools may need integration. Agree the supported flows and acceptance checks so your team can manage orders after launch.",
  ],
};
export default function ServiceDecisionGuide() {
  const { pathname } = useLocation();
  const guide = guides[pathname.split("/").filter(Boolean).at(-1) ?? ""];
  if (!guide) return null;
  return (
    <section className="mx-auto grid max-w-7xl gap-8 border-t border-border px-4 py-14 md:grid-cols-2 md:px-8">
      {[0, 2].map((i) => (
        <article key={guide[i]}>
          <h2 className="type-h3 text-foreground">{guide[i]}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {guide[i + 1]}
          </p>
        </article>
      ))}
    </section>
  );
}
