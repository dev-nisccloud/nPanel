import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Building2, Mail, Server, TrendingUp } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { ZepoChatStory, ZepoInboxStory } from "@/components/artwork/npanel-stories/ai-stories.tsx";
import { NPANEL_APP } from "@/lib/domain-search/api.ts";
import { ClosingCta } from "@/components/closing-cta.tsx";
import { CapabilityGroups, type CapabilityGroup } from "@/pages/services/_components/CapabilityGroups.tsx";
import { ZepoTokensSection } from "./_components/ZepoTokensSection.tsx";

const NPANEL_HOME = `${NPANEL_APP.replace(/\/+$/, "")}/`;

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Ask Zepo AI",
    artwork: <ZepoChatStory />,
    caption: false,
    headline: "Start with the service question in front of you",
    body: "Ask Zepo AI about your services, domains, invoices or what to buy next. It answers from what your account already holds, points you to the right action, and opens a support ticket with the conversation attached when a person needs to step in.",
    bullets: [
      "Chat available 24 hours a day",
      "Answers based on your own account",
      "A person takes over with the full conversation",
    ],
    mockupRight: true,
    visual: "bot",
  },
  {
    tag: "Your email assistant",
    artwork: <ZepoInboxStory />,
    caption: false,
    headline: "Your inbox, handled inside nPanel",
    body: "When you host email with Nisc Cloud or use Nisc Mail, Zepo AI works beside your inbox. It reads new messages, summarises long threads, drafts replies and helps you answer, all without leaving nPanel.",
    bullets: [
      "Summaries of long emails and threads",
      "Reply drafts you can edit, shorten or reshape",
      "Works with hosted business email and Nisc Mail",
    ],
    mockupRight: false,
    visual: "automation",
  },
];

const capabilities: CapabilityGroup[] = [
  {
    icon: Building2,
    title: "Understands your business",
    body: "What you do, your industry, who you sell to and every service in your Nisc Cloud account.",
    example: "Who are the main competitors for a bakery in Westlands?",
    items: [
      "Your business, industry and customers",
      "Your hosting, domains, email and invoices",
      "Context carried through the conversation",
    ],
  },
  {
    icon: TrendingUp,
    title: "Plans your growth",
    body: "Research and strategy you can act on, plus the visuals to go with it.",
    example: "Write a marketing plan for our December sale.",
    items: [
      "Market research on your industry",
      "Marketing and brand strategy",
      "Images for posts and campaigns",
      "A starter brand kit: colours, fonts, logo ideas",
    ],
  },
  {
    icon: Server,
    title: "Looks after your services",
    body: "It knows your services, so it can tell you what is coming up and help when something breaks.",
    example: "When does my hosting expire? Renew my domain.",
    items: [
      "Expiry dates and renewals; you confirm the payment",
      "Troubleshooting from your service details",
      "Support tickets opened with the chat attached",
      "Renewal reminders before anything lapses",
    ],
  },
  {
    icon: Mail,
    title: "Handles your email",
    body: "For Nisc Cloud hosted email and Nisc Mail, right inside nPanel.",
    example: "Summarise today's emails and draft a reply to Kito Events.",
    items: [
      "Reads and summarises new messages",
      "Drafts replies in your tone",
      "Helps you reply without leaving nPanel",
    ],
  },
];

export default function AiAutomationPage() {
  return (
    <ServicePageShell
      badge="Zepo AI"
      headline={<>Meet Zepo AI. <br /><span className="text-primary">Built by Nisc Cloud to run your business with you.</span></>}
      subtext="Zepo AI understands your business from the moment you create your Nisc Cloud account. It researches your market, plans your marketing, looks after your services and handles your email, all inside nPanel. You pay only for what it does, in credits."
      serviceType="marketing"
      heroImage="/brand/zepo-mascot-hd.webp"
      heroImageStandalone
      primaryCtaLabel="Buy Zepo credits"
      heroCta2="Open Zepo AI in nPanel"
      heroCta2Href={NPANEL_HOME}
      trustStats={[
        { value: "300", label: "Free Credits To Start" },
        { value: "24/7", label: "Chat Availability" },
        { value: "Email", label: "Read, Reply, Draft" },
        { value: "Credits", label: "No Monthly Plan" },
      ]}
      showcaseBlocks={showcaseBlocks}
      contentSlots={{
        afterShowcase: (
          <CapabilityGroups
            title="One assistant for the business, the services and the inbox."
            intro="Ask in plain words. Zepo AI works from what it knows about your business and your Nisc Cloud account."
            groups={capabilities}
          />
        ),
      }}
      plans={[]}
      customPlansSection={<ZepoTokensSection />}
      process={[
        { num: "01", title: "Create your account", desc: "Zepo AI starts from your business details and the services in your Nisc Cloud account." },
        { num: "02", title: "Get 300 free credits", desc: "They land in your team wallet when you first start Zepo AI with an active service such as hosting or email." },
        { num: "03", title: "Ask or hand over a task", desc: "Ask a question, open your inbox, or give Zepo AI research, strategy, images or a service problem." },
        { num: "04", title: "Top up when you run low", desc: "Buy a credit pack here or in nPanel. There is no monthly plan." },
      ]}
      faqs={[
        { q: "How do credits work?", a: "Each reply or task Zepo AI completes uses credits from your team wallet. Short questions use a few; research, strategy, documents and images use more. Your balance shows in nPanel, and you buy a new pack when you run low." },
        { q: "How do I get the 300 free credits?", a: "They are added once to your team wallet when you first start Zepo AI, as long as your team has an active Nisc Cloud service such as hosting or business email." },
        { q: "Can Zepo AI renew my domain or hosting?", a: "Yes. Ask it and it tells you what is due, then starts the renewal for you. You confirm the payment before anything is charged." },
        { q: "Can it help when something stops working?", a: "Yes. Zepo AI can read the details of your hosting, domains, DNS and email to help you find the problem. If it needs a person, it opens a support ticket with the conversation attached." },
        { q: "Which email can Zepo AI work with?", a: "Email hosted with Nisc Cloud, including Nisc Mail. It reads, summarises and drafts replies inside nPanel, and you decide what gets sent." },
        { q: "What does Zepo AI know about my business?", a: "What you tell it and what is in your Nisc Cloud account: your business details, services, domains and invoices. Keep passwords and other secrets out of the chat." },
      ]}
      closing={
        <ClosingCta
          headline="Let Zepo AI take the busywork"
          subtext="Create your account, add a service and start with 300 free credits. Zepo AI is waiting inside nPanel."
          primary={{ label: "Buy Zepo credits", href: "#plans" }}
          secondary={{ label: "Open Zepo AI in nPanel", href: NPANEL_HOME, external: true }}
          steps={["Create your Nisc Cloud account", "Get 300 free credits with a service", "Ask Zepo AI inside nPanel"]}
        />
      }
    />
  );
}
