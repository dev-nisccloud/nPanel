import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const categories = [
  {
    label: "General",
    items: [
      {
        question: "What do you actually help with?",
        answer:
          "We help you get online, stay online, and grow. That can mean brand and website design, hosting, domains, business email, SEO, ads, social media, email marketing, and smart automation with Zeepo AI. You work with one team and one clear plan instead of many separate vendors.",
      },
      {
        question: "How is this different from hiring separate agencies?",
        answer:
          "Separate teams often do not share one plan. Your brand can look different everywhere, and when something breaks it is hard to know who owns the fix. We keep design, hosting, and marketing under one strategy so the work stays aligned and someone is accountable.",
      },
      {
        question: "Who is this for?",
        answer:
          "Businesses of every size, from first websites to teams that already sell online. If you want clear hosting and marketing help without juggling five vendors, we are a fit.",
      },
    ],
  },
  {
    label: "Hosting & Domains",
    items: [
      {
        question: "How fast can my website go live?",
        answer:
          "Domain registration is quick after checkout. Once you pick a hosting plan, we help you set up and move over if needed. A simple site can go live in hours. A full design project takes longer depending on the scope, and we will give you a clear timeline up front.",
      },
      {
        question: "What happens if my website goes down?",
        answer:
          "We aim for 99.99% uptime on hosting. If something goes wrong, our 24/7 support team works to restore service. Free migration help is available when you move to us.",
      },
      {
        question: "Can I transfer my existing domain?",
        answer:
          "Yes. We support domain transfers and walk you through each step. Transfer timelines depend on your current registrar, and our team helps at no extra transfer fee from us.",
      },
      {
        question: "Do you offer .co.ke and other domain endings?",
        answer:
          "Yes. You can register .co.ke, .com, and many other endings. Search for the name you want, check out easily, and we help you point it to your hosting.",
      },
    ],
  },
  {
    label: "Marketing & Branding",
    items: [
      {
        question: "How long does SEO take to show results?",
        answer:
          "SEO is a steady process. Many clients see clearer movement in traffic and rankings within about 60 to 90 days. Stronger results usually need consistent work over several months. We set goals you can measure and report on progress.",
      },
      {
        question: "What is AEO and GEO?",
        answer:
          "AEO means making your content easy for AI answer tools to use. GEO means showing up in local and map-style results where people search nearby. Together with classic SEO, the goal is simple: people find you when they look for what you sell.",
      },
      {
        question: "Do I need a minimum ad spend for paid advertising?",
        answer:
          "Yes. Our Ads Starter plan needs a minimum ad spend of KES 10,000 per month, separate from the management fee. That spend goes to the ad platforms. We will help you set a budget that matches your goals.",
      },
      {
        question: "Can you manage my existing social media accounts?",
        answer:
          "Yes. We can take over existing accounts or set up new ones. We start with a review of what you have, then build a content plan that matches your brand and goals.",
      },
    ],
  },
  {
    label: "Zeepo AI",
    items: [
      {
        question: "What is Zeepo AI?",
        answer:
          "Zeepo AI is our automation toolkit for marketing busywork. It can help with content drafts, email follow-ups, chat replies, and simple workflows so your marketing keeps moving even when your team is offline.",
      },
      {
        question: "Do I need technical knowledge to use Zeepo AI?",
        answer:
          "No. We set it up, train it on your brand voice, and manage the flows. You review outputs and approve what goes out. No coding needed.",
      },
    ],
  },
  {
    label: "Billing & Support",
    items: [
      {
        question: "How do I pay?",
        answer:
          "Paying is simple. Checkout is built for everyday payment methods, and we can help you set up recurring billing for monthly services.",
      },
      {
        question: "Is there a long contract?",
        answer:
          "Monthly services like hosting, SEO, ads, and social are month to month with 30 days notice to cancel. One-off projects like websites and brand work are paid by milestone. We do not lock you into long contracts.",
      },
      {
        question: "What does the 30-day results promise mean?",
        answer:
          "For marketing services, if we do not show measurable progress within 30 days, such as traffic movement, leads, or a live campaign, we keep working at no extra charge until we do. We define what progress means with you during onboarding.",
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
