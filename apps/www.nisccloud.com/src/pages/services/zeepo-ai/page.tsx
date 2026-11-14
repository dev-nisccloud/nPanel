import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { ZEPO_AI_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { Zap, MessageSquare, BarChart2, Users, Calendar, Shield, Sparkles } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "24/7 Customer Help",
    headline: "Start with the service question in front of you",
    body: "Use Zepo chat to understand Nisc Cloud services, compare suitable options from the needs you describe, or find the relevant account action. When a customer-service or technical request needs a person, Zepo can pass on the conversation context.",
    bullets: [
      "Chat available 24 hours a day",
      "Guidance based on the details you provide",
      "Human escalation for eligible support requests",
    ],
    mockupRight: true,
    visual: "bot",
  },
  {
    tag: "Business Support",
    headline: "Turn approved context into a reviewable first draft",
    body: "After onboarding, Zepo can use the business information you choose to provide when supporting a task. Research notes, written drafts, image concepts, and recommendations remain starting points for your team to check.",
    bullets: [
      "Research organised around a stated question",
      "Written or visual drafts for supported tasks",
      "Recommendations presented for human review",
    ],
    mockupRight: false,
    visual: "results",
  },
];

export default function AiAutomationPage() {
  return (
    <ServicePageShell
      badge="AI Automation"
      headline={<>Meet Zepo. <br /><span className="text-primary">A starting point for everyday work.</span></>}
      subtext="Zepo combines Nisc Cloud service guidance with supported research, drafting, image, marketing, SEO, and technical-guidance tasks. You choose the context it may use, review its output, and keep a human route for eligible support requests."
      serviceType="marketing"
      checkoutServiceType="ai_automation"
      checkoutProductName="Zepo AI"
      heroImage="/brand/zepo-mascot.webp"
      heroImageStandalone
      trustStats={[
        { value: "24/7", label: "Chat Availability" },
        { value: "Human", label: "Review Stays Required" },
        { value: "Scoped", label: "Supported Tasks" },
        { value: "Your", label: "Context Controls" },
      ]}
      features={[
        {
          icon: <ZepoMascot className="size-7" />,
          title: "Nisc Cloud service assistant",
          desc: "Ask about Nisc Cloud services and compare suitable options using the needs and account details available in the conversation.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "Conversation continuity",
          desc: "Keep the question, relevant details, and prior messages together so you do not have to restart the same service conversation from scratch.",
        },
        {
          icon: <Zap size={20} />,
          title: "Renewal reminders",
          desc: "Receive reminders for approaching Nisc Cloud service renewals and follow the relevant confirmed account flow to take action.",
        },
        {
          icon: <Calendar size={20} />,
          title: "Research and drafting",
          desc: "Explore a stated topic, organise findings, and prepare a first draft that your team checks for accuracy, sources, and fit.",
        },
        {
          icon: <Users size={20} />,
          title: "Approved business context",
          desc: "Choose the relevant business information Zepo may use after onboarding, and update that context as your needs change.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "SEO and Marketing Support",
          desc: "Generate reviewable ideas for SEO, campaigns, messaging, and sales hooks without treating suggestions as guaranteed outcomes.",
        },
        {
          icon: <Shield size={20} />,
          title: "Customer and technical escalation",
          desc: "Eligible customer-service or technical requests can be handed to the appropriate team with relevant conversation context.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Content and image generation",
          desc: "Create written or visual starting points for supported tasks. Your team checks facts, rights, brand fit, and suitability before use.",
        },
      ]}
      plans={ZEPO_AI_PLANS}
      process={[
        { num: "01", title: "Choose a supported job", desc: "Start with a clear service question or a defined research, drafting, image, SEO, marketing, sales, or technical-guidance task." },
        { num: "02", title: "Share only relevant context", desc: "Provide the business details and preferences needed for that job. Keep passwords, secrets, and unnecessary personal or confidential data out of prompts." },
        { num: "03", title: "Check the output", desc: "Review facts, sources, tone, rights, risks, and technical recommendations before publishing or acting on generated work." },
        { num: "04", title: "Confirm or escalate", desc: "Use confirmed account flows for service, billing, or access actions. Eligible customer-service and technical issues can move to a person with context." },
      ]}
      whyPoints={[
        { title: "One place to start", desc: "Begin common service questions and supported knowledge-work tasks in one chat instead of deciding which tool to open first.", visual: "speed" },
        { title: "Context you deliberately provide", desc: "Business-aware output uses relevant information you approve rather than claiming to know facts you have not shared.", visual: "localMarket" },
        { title: "First drafts, not final authority", desc: "Zepo helps teams move from a blank page to something concrete while keeping factual and professional judgement with people.", visual: "bot" },
        { title: "A human route for support", desc: "Customer-service and technical requests can be escalated when the issue falls outside a safe self-service answer.", visual: "support" },
        { title: "Control before consequence", desc: "Generated guidance does not replace confirmed flows for changes affecting services, billing, access, or publication.", visual: "pricing" },
        { title: "Connected to the Nisc Cloud journey", desc: "Service guidance, renewal reminders, and escalation relate to the Nisc Cloud services managed through your account.", visual: "integrate" },
      ]}
      faqs={[
        { q: "What can I ask Zepo?", a: "You can ask about Nisc Cloud services or use the supported tools available to your account for research, drafting, images, technical guidance, SEO, marketing, and sales ideas. Capability and limits can vary by account or service." },
        { q: "What happens when Zepo cannot complete my request?", a: "It may ask for clearer information, explain a limitation, or escalate an eligible customer-service or technical request to the appropriate Nisc Cloud team with the relevant conversation context." },
        { q: "Does Zepo know my business?", a: "Only from the approved context and relevant Nisc Cloud service information available to it. You should correct outdated details and avoid supplying credentials or unnecessary sensitive data." },
        { q: "Does Zepo make changes automatically?", a: "Generated content, recommendations, and technical guidance require review. Actions affecting services, billing, or access must use the relevant confirmed account flow; Zepo should not be treated as automatic authorisation." },
        { q: "Can Zepo remind me about renewals?", a: "Yes. Zepo can remind you about approaching Nisc Cloud service renewals and point you to the relevant account action." },
        { q: "Is Zepo available all day?", a: "The chat is available 24 hours a day. A human response after escalation follows the availability and scope of the relevant support team." },
      ]}
      ctaHeadline="Put Zepo to work across your business"
      ctaSubtext="Start with one service question or supported task, provide only the context it needs, and keep review and consequential decisions with your team."
      pricingNote={SERVICE_PACKAGE_NOTES.ZEPO_AI}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
