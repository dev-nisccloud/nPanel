import Faq from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const demoFaqs = [
  {
    question: "What services does Nisc Cloud offer?",
    answer:
      "We offer web design, brand identity, digital marketing, cloud hosting, SEO, email marketing, and AI automation — all tailored for Kenyan businesses.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "Timelines depend on scope. Brand and website projects typically take 1–3 weeks. Marketing retainers launch within 7–14 days after onboarding.",
  },
  {
    question: "How is pricing structured?",
    answer:
      "Most services use fixed monthly or one-off packages shown on each service page. Custom scopes are quoted after a discovery call.",
  },
  {
    question: "Do you offer ongoing support after project completion?",
    answer:
      "Yes. Every plan includes post-launch support, and we offer ongoing maintenance and retainer packages for clients who need regular updates.",
  },
  {
    question: "How often will I receive updates on my project?",
    answer:
      "We provide regular progress updates via email or WhatsApp, plus scheduled review calls depending on your plan and project type.",
  },
];

export default function Faq01Page() {
  return <Faq faqs={demoFaqs} />;
}
