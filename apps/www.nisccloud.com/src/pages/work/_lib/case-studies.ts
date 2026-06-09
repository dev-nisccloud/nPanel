export type CaseStudy = {
  slug: string;
  client: string;
  industry: string;
  category: "Create" | "Launch" | "Market" | "Automate" | "Full Atom";
  tagline: string;
  description: string;
  coverImage: string;
  accentColor: string;
  duration: string;
  year: string;
  challenge: string;
  solution: string;
  results: { label: string; value: string; delta: string }[];
  services: string[];
  testimonial: { quote: string; author: string; role: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "verdant-co",
    client: "Verdant Co.",
    industry: "E-Commerce / Lifestyle",
    category: "Full Atom",
    tagline: "From zero to $1.2M in 14 months",
    description:
      "A sustainable lifestyle brand needed a complete digital presence - brand identity, Shopify store, paid acquisition, and post-purchase automation.",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-green-400",
    duration: "14 months",
    year: "2023",
    challenge:
      "Verdant launched with a great product but no digital footprint, no email list, and a limited budget. They needed to build trust and drive revenue fast without overspending on paid media.",
    solution:
      "We ran the full Atom Approach: designed their brand and Shopify store (Create), launched with a targeted Meta campaign (Launch), scaled with SEO + influencer content (Market), and built a post-purchase Klaviyo flow that turned buyers into repeat customers (Automate).",
    results: [
      { label: "Revenue in 14 months", value: "$1.2M", delta: "+∞ (from $0)" },
      { label: "Email list growth", value: "42,000", delta: "+42,000" },
      { label: "Return customer rate", value: "38%", delta: "+38%" },
      { label: "ROAS (Meta Ads)", value: "4.8×", delta: "+4.8×" },
    ],
    services: ["Brand & Web Design", "Shopify Development", "Paid Social", "Email Automation"],
    testimonial: {
      quote:
        "Nisc Cloud didn't just build our website - they built our entire business engine. We'd still be figuring out ads if it wasn't for them.",
      author: "Camille Osei",
      role: "Founder, Verdant Co.",
    },
  },
  {
    slug: "apex-realty",
    client: "Apex Realty Group",
    industry: "Real Estate",
    category: "Launch",
    tagline: "64% more qualified leads in 60 days",
    description:
      "A regional real estate agency struggling with an outdated website and zero inbound leads needed a full rebrand and digital launch strategy.",
    coverImage:
      "https://images.unsplash.com/photo-1617052167777-f0f26b5c54f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-blue-400",
    duration: "60 days",
    year: "2024",
    challenge:
      "Apex was losing deals to competitors who showed up on Google first. Their site hadn't been updated in 5 years and wasn't mobile-friendly. Lead volume was almost entirely referral-dependent.",
    solution:
      "We redesigned their site with a modern property search experience (Create), then launched Google Local Service Ads and an SEO content blitz targeting high-intent real estate keywords (Launch). Added a CRM-connected lead form with instant SMS follow-up.",
    results: [
      { label: "Qualified leads / month", value: "+64%", delta: "+64%" },
      { label: "Google ranking (avg)", value: "Top 3", delta: "From page 4" },
      { label: "Lead response time", value: "< 2 min", delta: "Was 4+ hours" },
      { label: "Organic traffic", value: "+210%", delta: "+210% in 3 months" },
    ],
    services: ["Website Redesign", "Google Ads", "Local SEO", "CRM Integration"],
    testimonial: {
      quote:
        "We went from chasing referrals to having a full calendar. The phone just doesn't stop - in the best way possible.",
      author: "Derek Holt",
      role: "Managing Partner, Apex Realty Group",
    },
  },
  {
    slug: "pulse-fitness",
    client: "Pulse Fitness Studio",
    industry: "Health & Wellness",
    category: "Market",
    tagline: "Sold out every class for 6 straight months",
    description:
      "A boutique fitness studio needed social media strategy and a paid campaign to fill classes and build a loyal community.",
    coverImage:
      "https://images.unsplash.com/photo-1769893841740-fc98ce39a3cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-orange-400",
    duration: "6 months",
    year: "2023",
    challenge:
      "Pulse had phenomenal in-person reviews but practically no online presence. Class bookings were inconsistent, and they had no system for retaining members who dropped off.",
    solution:
      "We created a 90-day content calendar targeting local audiences on Instagram and TikTok, ran Meta Ads with a free trial offer, and built an automated email nurture sequence that reactivated lapsed members.",
    results: [
      { label: "Class fill rate", value: "100%", delta: "From 60%" },
      { label: "New member sign-ups", value: "+187", delta: "+187 in 6 months" },
      { label: "Member retention", value: "+41%", delta: "+41%" },
      { label: "Instagram followers", value: "8,400", delta: "From 320" },
    ],
    services: ["Social Media Management", "Paid Social", "Email Marketing", "Content Strategy"],
    testimonial: {
      quote:
        "We had a waiting list for the first time ever. Nisc Cloud turned our little studio into a community brand people actually talk about.",
      author: "Jasmine Torres",
      role: "Owner, Pulse Fitness Studio",
    },
  },
  {
    slug: "stackr-app",
    client: "Stackr",
    industry: "SaaS / Technology",
    category: "Automate",
    tagline: "Cut CAC by 52% with a full-funnel automation stack",
    description:
      "A B2B SaaS startup needed to scale pipeline without scaling headcount - so we built a fully automated demand-gen and nurture engine.",
    coverImage:
      "https://images.unsplash.com/photo-1642132652866-6fa262d3161f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-primary",
    duration: "4 months",
    year: "2024",
    challenge:
      "Stackr was spending heavily on outbound SDRs with low conversion. Every new lead required manual follow-up, and deals were slipping through the cracks between demo request and close.",
    solution:
      "We mapped the entire buyer journey and automated it: LinkedIn outreach sequences, instant demo-booking via HubSpot, a 10-step email nurture series, and a Slack-integrated deal alert system. Their team now only talks to qualified, demo-ready leads.",
    results: [
      { label: "Customer Acquisition Cost", value: "-52%", delta: "-52%" },
      { label: "Demo-to-close rate", value: "+33%", delta: "+33%" },
      { label: "Pipeline generated (Q1)", value: "$840K", delta: "New" },
      { label: "Hours saved per month", value: "120 hrs", delta: "Automated" },
    ],
    services: ["Marketing Automation", "HubSpot Setup", "Email Sequences", "Lead Scoring"],
    testimonial: {
      quote:
        "Our sales team went from admin hell to closing machine. The automation stack Nisc built basically added two headcount without the cost.",
      author: "Elliot Zhang",
      role: "CEO, Stackr",
    },
  },
  {
    slug: "harbour-eats",
    client: "Harbour Eats",
    industry: "Food & Hospitality",
    category: "Create",
    tagline: "A restaurant brand built to last - and to rank",
    description:
      "A multi-location restaurant group needed a brand refresh, a new website, and an online ordering experience that actually converted.",
    coverImage:
      "https://images.unsplash.com/photo-1490222939321-2a267366a124?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-yellow-400",
    duration: "8 weeks",
    year: "2022",
    challenge:
      "Three locations, three different logos, and a website that sent customers straight to a third-party delivery app (with 30% fees). They needed a cohesive brand and a way to own the ordering experience.",
    solution:
      "We unified their brand identity across all three locations (Create), built a custom ordering website with direct integration to their POS system, and launched a local SEO campaign targeting food search intent.",
    results: [
      { label: "Direct orders (vs. 3rd party)", value: "+270%", delta: "+270%" },
      { label: "Delivery commission saved", value: "$48K/yr", delta: "Recovered" },
      { label: "Google Maps ranking", value: "#1", delta: "Local pack" },
      { label: "Website conversion rate", value: "12.4%", delta: "Industry avg: 3%" },
    ],
    services: ["Brand Identity", "Web Design & Dev", "Online Ordering", "Local SEO"],
    testimonial: {
      quote:
        "We stopped paying Uber Eats thousands a month and started owning our customers. This was the best business decision we made last year.",
      author: "Nadia Chen",
      role: "Co-founder, Harbour Eats",
    },
  },
  {
    slug: "lumex-solar",
    client: "Lumex Solar",
    industry: "Clean Energy",
    category: "Full Atom",
    tagline: "From local installer to regional market leader",
    description:
      "A solar installation company wanted to dominate their metro area with a brand that matched their quality and a digital engine that generated consistent leads.",
    coverImage:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accentColor: "text-yellow-300",
    duration: "12 months",
    year: "2023",
    challenge:
      "Despite excellent reviews, Lumex Solar was invisible online in a crowded local market. Their competitors were outspending them on Google Ads and their website hadn't been updated since 2019.",
    solution:
      "Full Atom treatment: new brand and website (Create), aggressive Google Ads + GBP optimization (Launch), monthly SEO blog targeting 'solar incentives' keywords (Market), and a CRM pipeline automation that followed up with every estimate automatically (Automate).",
    results: [
      { label: "Inbound leads / month", value: "3× more", delta: "+200%" },
      { label: "Avg deal size", value: "+28%", delta: "Upsell automation" },
      { label: "Google Ads ROAS", value: "6.2×", delta: "+6.2×" },
      { label: "Market share (metro)", value: "#2", delta: "From #8" },
    ],
    services: ["Branding", "Web Development", "Google Ads", "SEO", "CRM Automation"],
    testimonial: {
      quote:
        "We tripled our install volume without tripling our team. The systems Nisc Cloud built handle the follow-up so we can focus on the work.",
      author: "Marcus Webb",
      role: "Founder, Lumex Solar",
    },
  },
];
