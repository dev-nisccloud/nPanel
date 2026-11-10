import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { ZEPO_AI_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { Bot, Zap, MessageSquare, BarChart2, Users, Calendar, Shield, Sparkles } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "24/7 Customer Help",
    headline: "Helpful answers, with a human path when needed.",
    body: "Zepo answers questions about your Nisc Cloud services at any time, recommends plans around your stated needs and can escalate a conversation to customer service or technical support.",
    bullets: [
      "Available through chat 24 hours a day",
      "Reminders before your Nisc Cloud services renew",
      "Escalation to the right support team with conversation context",
    ],
    mockupRight: true,
    visual: "bot",
  },
  {
    tag: "Business Support",
    headline: "Work with context, not a blank prompt.",
    body: "After you create an account and provide the relevant information, Zepo can use your approved business context to support research, marketing ideas, sales hooks, content and SEO tasks.",
    bullets: [
      "Research and content generation",
      "Image generation for supported creative tasks",
      "SEO, marketing and sales recommendations for review",
    ],
    mockupRight: false,
    visual: "results",
  },
];

export default function AiAutomationPage() {
  return (
    <ServicePageShell
      badge="AI Automation"
      headline={<>Meet Zepo. <br /><span className="text-primary">AI Support Across Your Business.</span></>}
      subtext="Zepo is Nisc Cloud's AI assistant for 24/7 service chat, research, content and image generation, marketing, SEO and technical guidance. It uses the business context you approve and escalates to a person when your request needs customer service or technical support."
      serviceType="marketing"
      checkoutServiceType="ai_automation"
      checkoutProductName="Zepo AI"
      trustStats={[
        { value: "24/7", label: "Chat Availability" },
        { value: "Human", label: "Handoff When Needed" },
        { value: "Free", label: "Setup Help Included" },
        { value: "Your", label: "Approved Business Context" },
      ]}
      features={[
        {
          icon: <Bot size={20} />,
          title: "Nisc Cloud Service Assistant",
          desc: "Ask about domains, hosting, email, servers and other Nisc Cloud services. Zepo recommends suitable options from the information you provide.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "24/7 Chat",
          desc: "Get help through chat at any time, including outside normal working hours. Requests that need a person can be escalated with their context.",
        },
        {
          icon: <Zap size={20} />,
          title: "Renewal Reminders",
          desc: "Zepo can remind you when Nisc Cloud services are approaching renewal and guide you to the relevant account action.",
        },
        {
          icon: <Calendar size={20} />,
          title: "Research and Drafting",
          desc: "Research a topic, organise findings and create a first draft for your team to review before anything is published.",
        },
        {
          icon: <Users size={20} />,
          title: "Business-Aware Recommendations",
          desc: "After onboarding, Zepo can use the approved information in your account to tailor suggestions to your business and current services.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "SEO and Marketing Support",
          desc: "Get suggestions for SEO fixes, campaign ideas, messaging and sales hooks. Your team reviews and approves the output.",
        },
        {
          icon: <Shield size={20} />,
          title: "Customer and Technical Escalation",
          desc: "When Zepo cannot complete a request safely or accurately, it can escalate to customer service or technical support.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Content and Image Generation",
          desc: "Create written and visual starting points for supported business tasks, with review before they are used.",
        },
      ]}
      plans={ZEPO_AI_PLANS}
      process={[
        { num: "01", title: "Create Your Account", desc: "Start with your Nisc Cloud account and the services you use. Zepo can answer general questions before it has business-specific context." },
        { num: "02", title: "Add Approved Context", desc: "Provide the business information, services and preferences that Zepo may use. Keep sensitive credentials and private data out of prompts." },
        { num: "03", title: "Ask and Review", desc: "Use Zepo for research, drafts, images, technical guidance and marketing ideas. Review generated work before publishing or acting on it." },
        { num: "04", title: "Escalate When Needed", desc: "Customer-service and technical requests that need a person move to the appropriate team with the conversation context." },
      ]}
      whyPoints={[
        { title: "Available When You Need It", desc: "Ask questions through chat at any time, including outside normal support working hours.", visual: "speed" },
        { title: "Grounded in Your Account", desc: "Recommendations can use the approved business context and Nisc Cloud services connected to your account.", visual: "localMarket" },
        { title: "Useful Across Teams", desc: "Support research, technical questions, SEO, marketing, sales messaging, written content and image ideas from one assistant.", visual: "bot" },
        { title: "A Human Path Remains", desc: "Zepo can escalate customer-service and technical requests when a person needs to take over.", visual: "support" },
        { title: "Review Before Use", desc: "Generated content and recommendations are starting points. Your team remains responsible for reviewing and approving them.", visual: "pricing" },
        { title: "Built into Nisc Cloud", desc: "Zepo sits alongside the services, support and account information you manage through Nisc Cloud.", visual: "integrate" },
      ]}
      faqs={[
        { q: "What can I ask Zepo?", a: "Ask about Nisc Cloud services or use supported tools for research, drafting, images, technical guidance, SEO, marketing and sales ideas. Capabilities can vary by account and service." },
        { q: "What happens when Zepo cannot complete my request?", a: "Zepo can escalate customer-service and technical requests to the appropriate Nisc Cloud team with the conversation context." },
        { q: "Does Zepo know my business?", a: "After you create an account and provide approved context, Zepo can tailor recommendations around that information and the Nisc Cloud services you use." },
        { q: "Does Zepo make changes automatically?", a: "Generated content, recommendations and technical guidance require your review. Actions that affect services, billing or access must use the relevant confirmed account flow." },
        { q: "Can Zepo remind me about renewals?", a: "Yes. Zepo can remind you about approaching Nisc Cloud service renewals and point you to the relevant account action." },
        { q: "Is Zepo available all day?", a: "The chat is available 24 hours a day. Requests that require customer service or technical support follow the relevant support-team availability after escalation." },
      ]}
      ctaHeadline="Put Zepo to Work Across Your Business"
      ctaSubtext="Use one assistant for service questions, research, content, images, SEO, marketing and technical guidance, with a human path when it is needed."
      pricingNote={SERVICE_PACKAGE_NOTES.ZEPO_AI}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
