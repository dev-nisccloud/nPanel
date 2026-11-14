/** Quoted project packages. No public prices. Scope comes from the plans these replace. */

export type ProjectPackage = {
  id: string;
  name: string;
  summary: string;
  includes: readonly string[];
};

export type ProjectOffer = {
  id: "website" | "ecommerce" | "brand" | "software";
  /** Lead API service key. */
  serviceValue: "create" | "software";
  serviceLabel: string;
  heading: string;
  intro: string;
  packages: readonly [ProjectPackage, ProjectPackage, ProjectPackage];
  projectTypes: readonly { value: string; label: string }[];
  readyOptions: readonly { value: string; label: string }[];
  extras: readonly string[];
};

const PAYMENT =
  "The price is fixed in the proposal. You pay 50% to start and 50% at launch. There is no hourly billing.";

export const WEBSITE_OFFER: ProjectOffer = {
  id: "website",
  serviceValue: "create",
  serviceLabel: "Website design",
  heading: "Three ways to start a website",
  intro: PAYMENT,
  packages: [
    {
      id: "small-business",
      name: "Small Business",
      summary: "A compact site that helps people find you and get in touch.",
      includes: [
        "Up to 5 pages",
        "Mobile-responsive design",
        "Contact form and WhatsApp button",
        "On-page SEO and an SSL certificate",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      summary: "A broader site your team can update after handover.",
      includes: [
        "Page count agreed in the proposal",
        "A CMS your team can edit",
        "Enquiry paths and on-page SEO",
        "Handover training",
      ],
    },
    {
      id: "corporate",
      name: "Corporate",
      summary: "A custom build for a larger organisation or more than one language.",
      includes: [
        "Custom interface design",
        "CMS, with more than one language when you need it",
        "SEO audit and schema markup",
        "6 months of priority support",
      ],
    },
  ],
  projectTypes: [
    { value: "new", label: "New website" },
    { value: "redesign", label: "Redesign" },
    { value: "unsure", label: "Not sure yet" },
  ],
  readyOptions: [
    { value: "brand", label: "Logo and colours" },
    { value: "copy", label: "Copy" },
    { value: "photos", label: "Photography" },
    { value: "domain", label: "A domain" },
  ],
  extras: ["Professional copywriting", "Monthly maintenance", "Speed and security audit"],
};

export const ECOMMERCE_OFFER: ProjectOffer = {
  id: "ecommerce",
  serviceValue: "create",
  serviceLabel: "E-commerce store",
  heading: "Three ways to start a store",
  intro: `${PAYMENT} Hosting and payment-provider fees are separate.`,
  packages: [
    {
      id: "small-business",
      name: "Small Business",
      summary: "A first store with a manageable catalogue and checkout.",
      includes: [
        "Up to 50 products",
        "Mobile money and card checkout setup",
        "Order management",
        "A mobile storefront",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      summary: "A larger catalogue your team runs day to day.",
      includes: [
        "Product variants",
        "Checkout and order management",
        "Delivery rules in the agreed scope",
        "Handover training",
      ],
    },
    {
      id: "corporate",
      name: "Corporate",
      summary: "A store with the integrations a larger operation needs.",
      includes: [
        "A full catalogue with variants",
        "Abandoned-cart emails",
        "Marketplace or accounting integration when it is in scope",
        "Manager training",
      ],
    },
  ],
  projectTypes: [
    { value: "new", label: "New store" },
    { value: "move", label: "Move an existing store" },
    { value: "unsure", label: "Not sure yet" },
  ],
  readyOptions: [
    { value: "catalogue", label: "A product list" },
    { value: "photos", label: "Product photos" },
    { value: "gateway", label: "A payment account" },
    { value: "domain", label: "A domain" },
  ],
  extras: ["Express mobile checkout setup", "Monthly store maintenance", "Product photography"],
};

export const BRAND_OFFER: ProjectOffer = {
  id: "brand",
  serviceValue: "create",
  serviceLabel: "Brand identity",
  heading: "Three ways to start a brand",
  intro: `${PAYMENT} Approved deliverables transfer after the invoices are paid, subject to the proposal and any third-party licences.`,
  packages: [
    {
      id: "small-business",
      name: "Small Business",
      summary: "A logo and a short guide your team can use straight away.",
      includes: [
        "Three logo concepts",
        "PNG, SVG and PDF files",
        "Colour and typography",
        "A short brand guide and a business card",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      summary: "A guide that covers more than the logo.",
      includes: [
        "A fuller brand guide",
        "Social profile kit",
        "Print and digital applications",
        "Revision rounds agreed in the proposal",
      ],
    },
    {
      id: "corporate",
      name: "Corporate",
      summary: "Strategy, a full manual and support after delivery.",
      includes: [
        "Full brand guidelines",
        "Positioning and a competitor review",
        "Social profile kit",
        "30 days of support after delivery",
      ],
    },
  ],
  projectTypes: [
    { value: "new", label: "New identity" },
    { value: "refresh", label: "Refresh" },
    { value: "rebrand", label: "Rebrand" },
  ],
  readyOptions: [
    { value: "name", label: "A business name" },
    { value: "audience", label: "A clear audience" },
    { value: "existing", label: "An existing logo" },
    { value: "examples", label: "Brands you admire" },
  ],
  extras: ["Brand story video", "Print collateral", "Quarterly consistency review"],
};

export const SOFTWARE_OFFER: ProjectOffer = {
  id: "software",
  serviceValue: "software",
  serviceLabel: "Custom software",
  heading: "Three ways to start custom software",
  intro: `${PAYMENT} Hosting is quoted on its own.`,
  packages: [
    {
      id: "small-business",
      name: "Small Business",
      summary: "One workflow or internal tool, scoped before anyone builds it.",
      includes: [
        "One workflow",
        "The screens agreed in the proposal",
        "Handover and a short training",
        "Support boundaries written down",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      summary: "A product people sign in to, with the integrations you name up front.",
      includes: [
        "Accounts for the people who use it",
        "Integrations named in discovery",
        "A staged release",
        "Handover training",
      ],
    },
    {
      id: "corporate",
      name: "Corporate",
      summary: "A system for more than one team, with the reporting you need.",
      includes: [
        "More than one team or brand",
        "Integrations and reporting in the proposal",
        "A staged release",
        "Support boundaries written down",
      ],
    },
  ],
  projectTypes: [
    { value: "web", label: "Web application" },
    { value: "mobile", label: "Mobile application" },
    { value: "internal", label: "Internal tool" },
    { value: "unsure", label: "Not sure yet" },
  ],
  readyOptions: [
    { value: "brief", label: "A written brief" },
    { value: "users", label: "A list of users" },
    { value: "systems", label: "Systems to connect" },
    { value: "designs", label: "Existing designs" },
  ],
  extras: [],
};
