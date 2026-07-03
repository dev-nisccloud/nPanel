import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const categories = [
  {
    label: "General",
    items: [
      {
        question: "What does 'A-to-Z digital partner' mean?",
        answer:
          "It means we handle every digital need your business has — from creating your brand identity and building your website, to hosting it on the cloud, running your marketing campaigns, and automating your growth with Zeepo AI. You work with one team, get one invoice, and never have to juggle multiple agencies.",
      },
      {
        question: "How is Nisc Cloud different from hiring separate agencies?",
        answer:
          "When you hire separate agencies for design, hosting, SEO, and ads — they don't talk to each other. Your brand looks different everywhere, strategies conflict, and you spend time coordinating. At Nisc Cloud, everything is integrated under one strategy, one brand voice, and one accountable team.",
      },
      {
        question: "Do you serve businesses outside Kenya?",
        answer:
          "Yes. While we are based in Nairobi and primarily serve Kenyan businesses, we work with clients across Africa and remotely worldwide. All services are available remotely.",
      },
    ],
  },
  {
    label: "Hosting & Domains",
    items: [
      {
        question: "How fast can my website go live?",
        answer:
          "Domain registration is instant. Once you choose a hosting plan and complete setup, your site can be live within hours. For a fully designed website, delivery timelines range from 5 days (landing page) to 21 days (e-commerce store).",
      },
      {
        question: "What happens if my website goes down?",
        answer:
          "We guarantee 99.9% uptime on all hosting plans. If there is ever downtime, our 24/7 support team is notified automatically and works to restore service immediately. Managed VPS clients get a dedicated response within 15 minutes.",
      },
      {
        question: "Can I transfer my existing domain to Nisc Cloud?",
        answer:
          "Yes. We support domain transfers from any registrar. The process takes 5–7 days. Our team will guide you step by step at no extra cost. Transfer pricing is listed on our Domains page.",
      },
      {
        question: "Do you support .co.ke domains?",
        answer:
          "Yes. We are an accredited .co.ke registrar through KENIC (Kenya Network Information Centre). We support .co.ke, .ke, .com, .africa, .net, .org, and many more extensions.",
      },
    ],
  },
  {
    label: "Marketing & Branding",
    items: [
      {
        question: "How long does SEO take to show results?",
        answer:
          "SEO is a long-term strategy. Most clients start seeing measurable improvements in rankings and organic traffic within 60–90 days. Significant results (top 3 Google rankings for target keywords) typically come within 4–6 months of consistent work.",
      },
      {
        question: "What is AEO and GEO?",
        answer:
          "AEO (Answer Engine Optimisation) means optimising your content to appear in AI-powered search tools like ChatGPT, Perplexity, and Google's AI Overviews. GEO (Generative Engine Optimisation) targets Google Maps and local AI results. Together with traditional SEO, they ensure customers find you everywhere they search — not just on Google.",
      },
      {
        question: "Do I need a minimum ad spend budget for paid advertising?",
        answer:
          "Yes. Our Ads Starter plan requires a minimum ad spend of KES 10,000/mo (separate from our management fee). This is the budget that goes directly to Google or Meta for your ads. We recommend KES 20,000–50,000/mo for optimal results.",
      },
      {
        question: "Can you manage my existing social media accounts?",
        answer:
          "Absolutely. We can take over existing accounts or set up new ones. We start with a full audit of your current presence, then build a content calendar and strategy aligned with your brand.",
      },
    ],
  },
  {
    label: "Zeepo AI",
    items: [
      {
        question: "What is Zeepo AI?",
        answer:
          "Zeepo AI is our proprietary AI-powered marketing automation platform. It creates content (blog posts, social captions, ad copy), automates your email sequences, manages CRM workflows, runs chatbot flows, and nurtures leads automatically — so your marketing runs 24/7 even when your team is offline.",
      },
      {
        question: "Do I need technical knowledge to use Zeepo AI?",
        answer:
          "No. Zeepo AI is fully managed by our team. We set up all workflows, train the AI on your brand voice, and manage everything. You simply review outputs and approve campaigns. No coding or technical skills required.",
      },
    ],
  },
  {
    label: "Billing & Support",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept M-Pesa (Paybill and Till), Visa, Mastercard, and bank transfer (KCB, Equity, NCBA). Monthly retainers can be set up on auto-pay via M-Pesa standing order.",
      },
      {
        question: "Is there a contract or can I cancel anytime?",
        answer:
          "Monthly services (hosting, SEO, ads, social media) are month-to-month with 30 days notice to cancel. One-off projects (website design, brand identity) are paid per milestone. We do not lock clients into long-term contracts — we earn your business every month.",
      },
      {
        question: "What does your '30-day results' guarantee mean?",
        answer:
          "For marketing services, if we don't show measurable progress within 30 days (traffic increase, leads generated, or campaign launch), we continue working at no extra charge until we do. We define 'measurable progress' clearly in your onboarding agreement.",
      },
    ],
  },
];

export default function Faq() {
  return (
    <div id="faq">
      <FaqBlock categories={categories} defaultCategory="General" />
    </div>
  );
}
