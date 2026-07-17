import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Bot, Zap, MessageSquare, BarChart2, Users, Calendar, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "AI Lead Response",
    headline: "Fast replies. Day and night.",
    body: "Buyers often choose the business that responds first. Our AI replies quickly on WhatsApp, your website, Facebook, and Instagram, so you stay available even after hours.",
    bullets: [
      "Fast average lead response time, 24/7 including weekends",
      "Conversations in English or Swahili, switching as needed",
      "Hot lead alerts sent to your WhatsApp when AI qualifies a buyer",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[#25D366] px-5 py-2.5 text-white text-sm font-bold flex items-center gap-2">
            <MessageSquare size={14} />
            WhatsApp Business AI
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { from: "customer", msg: "Habari, ninataka kununua laptop", time: "10:42" },
              { from: "ai", msg: "Karibu! Tunao laptops kuanzia KES 35,000. Unataka specs gani?", time: "10:42" },
              { from: "customer", msg: "Core i5, 8GB RAM", time: "10:43" },
              { from: "ai", msg: "Perfect! Tuna Lenovo IdeaPad - KES 42,000. Nitakupeleka catalogu sasa", time: "10:43" },
            ].map(({ from, msg, time }) => (
              <div key={time + from} className={`flex ${from === "ai" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${from === "ai" ? "bg-muted text-foreground" : "bg-[#25D366] text-white"}`}>
                  <div>{msg}</div>
                  <div className={`text-[9px] mt-0.5 text-right ${from === "ai" ? "text-muted-foreground" : "text-white/70"}`}>{time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Business Intelligence",
    headline: "Know exactly how many leads your AI converts",
    body: "Monthly AI performance reports show conversations handled, leads qualified, appointments booked, and revenue attributed to AI interactions. Clear ROI visibility, no guesswork.",
    bullets: [
      "Conversion analytics updated in your dashboard",
      "Message flows improved over time based on results",
      "CRM sync with HubSpot, Zoho, or Google Sheets",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">AI Performance This Month</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[["Conversations","Tracked"],["Leads Qualified","Reported"],["Appointments","Booked"],["Handoffs","Clear"]].map(([l,v]) => (
              <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                <div className="font-extrabold text-primary text-sm">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <CheckCircle2 size={22} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">Free setup help</div>
            <div className="text-xs text-muted-foreground">We train and launch with you</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function AiAutomationPage() {
  return (
    <ServicePageShell
      badge="AI Automation"
      headline={<>Automate Your Business.<br /><span className="text-primary">Grow Without the Overhead.</span></>}
      subtext="Our AI platform handles lead follow-up, customer support, appointment booking, and sales nurturing 24 hours a day, 7 days a week, in English and Swahili. Stop losing leads to slow responses and scale without hiring for every reply."
      serviceType="marketing"
      checkoutServiceType="ai_automation"
      checkoutProductName="Zeepo AI"
      trustStats={[
        { value: "24/7", label: "AI Always Available" },
        { value: "100+", label: "Clients We Have Helped" },
        { value: "Free", label: "Setup Help Included" },
        { value: "Clear", label: "Conversion Reporting" },
      ]}
      features={[
        {
          icon: <Bot size={20} />,
          title: "AI Sales Assistant",
          desc: "Qualify leads, answer product questions, and guide prospects through your sales funnel automatically, even when your team is offline.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "WhatsApp & SMS Automation",
          desc: "Automated WhatsApp Business flows that follow up with new leads, confirm appointments, send reminders, and re-engage cold prospects in natural conversation.",
        },
        {
          icon: <Zap size={20} />,
          title: "Instant Lead Response",
          desc: "Respond to every new lead quickly on WhatsApp, your website, Facebook, or Instagram. Speed of response is a major factor in lead conversion.",
        },
        {
          icon: <Calendar size={20} />,
          title: "Automated Appointment Booking",
          desc: "Our AI books appointments directly into your calendar, sends confirmations to clients, and sends reminders before each meeting.",
        },
        {
          icon: <Users size={20} />,
          title: "CRM Integration & Lead Tracking",
          desc: "All leads automatically logged, scored, and tagged in your CRM. Full conversation history, follow-up sequences, and pipeline visibility for your sales team.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Conversion Analytics",
          desc: "See how many leads the AI handled, how many converted, where prospects dropped off, and what messages perform best, with actionable monthly reports.",
        },
        {
          icon: <Shield size={20} />,
          title: "Human Escalation Protocols",
          desc: "Our AI knows its limits. Complex queries, unhappy customers, and high-value opportunities are handed to your human team with full context.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Swahili & English Support",
          desc: "Fully bilingual AI that switches between English and Swahili based on the customer's preference, because your customers communicate in both languages.",
        },
      ]}
      plans={[
        {
          id: "ai-starter",
          name: "AI Starter",
          price: 15000,
          period: "month",
          features: [
            "AI chatbot (website + WhatsApp)",
            "Up to 500 conversations/month",
            "Lead capture & qualification",
            "FAQ automation",
            "English + Swahili support",
            "5-day setup included",
          ],
        },
        {
          id: "ai-enterprise",
          name: "AI Enterprise",
          price: 70000,
          period: "month",
          features: [
            "Unlimited conversations, all channels",
            "Custom AI trained on your business",
            "Full sales pipeline automation",
            "Voice AI phone call handling",
            "Payment collection via WhatsApp",
            "Dedicated AI success manager",
          ],
        },
      ]}
      addons={[
        { id: "ai-voice", label: "Voice AI Phone Agent Setup", price: 30000, period: "once" },
        { id: "ai-mpesa", label: "WhatsApp Payment Collection Setup", price: 20000, period: "once" },
        { id: "ai-crm", label: "Custom CRM Build & Integration", price: 45000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Business Audit", desc: "We map your current lead flow, identify where prospects are dropping off, and design an AI automation strategy that fills the gaps and speeds up conversion." },
        { num: "02", title: "AI Training & Build", desc: "We train the AI on your products, services, pricing, FAQs, and brand voice. Build conversation flows, integrations, and human escalation paths." },
        { num: "03", title: "Test & Refine", desc: "Full testing across all channels before going live. We run simulated conversations, check escalation triggers, and refine responses based on real data." },
        { num: "04", title: "Launch & Optimise", desc: "Go live, monitor every conversation, and optimise monthly. AI performance improves over time as it handles more real interactions." },
      ]}
      whyPoints={[
        { title: "Local Business Context Built In", desc: "Our AI understands local payment habits, business hours, everyday terminology, and Swahili, unlike generic chatbot tools built for other markets." },
        { title: "Never Lose a Lead to Slow Response", desc: "Buyers often choose the company that responds first. Our AI helps you stay first even when you are in a meeting or offline." },
        { title: "Not Just a FAQ Bot", desc: "It qualifies leads, books appointments, can support payment flows where configured, and hands off complex cases. A real sales and support helper." },
        { title: "Works With Your Existing Tools", desc: "Integrates with Google Calendar, HubSpot, Zoho CRM, Google Sheets, payment tools, and other systems via Zapier and native APIs." },
        { title: "Cost-Effective Coverage", desc: "A human sales assistant costs far more each month plus benefits. Our AI covers high-volume replies and follow-up at a fraction of that cost, 24/7." },
        { title: "Your Team Stays Human", desc: "AI handles the repetitive volume work so your team focuses on high-value relationships, complex deals, and the things that need a human touch." },
      ]}
      faqs={[
        { q: "Will customers know they're talking to AI?", a: "You choose. We can configure the AI to be transparent, or to operate under your brand. Most clients choose a branded assistant with clear AI disclosure when directly asked." },
        { q: "What happens when the AI can't answer a question?", a: "When it encounters a question outside its knowledge base, or a frustrated customer, it immediately alerts your team via WhatsApp or email with the full conversation context." },
        { q: "Can the AI handle payments through WhatsApp?", a: "Yes, for Enterprise clients. We can enable mobile money payment prompts within a WhatsApp conversation where that add-on is configured." },
        { q: "How long does setup take?", a: "AI Starter takes about 5 business days. Growth takes about 10 days. Enterprise takes 2 to 3 weeks depending on integration complexity. Free setup help is included." },
        { q: "Can the AI be trained on my specific products and prices?", a: "Yes. During onboarding we collect your product and service information, pricing, policies, and FAQs. The AI is trained specifically on your business." },
        { q: "Is the conversation data secure?", a: "All conversation data is encrypted, stored securely, and never shared with third parties. You own all your data and can export it at any time." },
      ]}
      ctaHeadline="Let AI Work While You Focus on Growing"
      ctaSubtext="Every minute your team spends answering the same questions is a minute they are not closing deals. Automate the repetitive work and keep the human touch where it matters."
      pricingNote="Monthly subscription. AI improves over time. No setup fee on 3-month commitment."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
