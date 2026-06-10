import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Bot, Zap, MessageSquare, BarChart2, Users, Calendar, Shield, Sparkles } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "AI Lead Response",
    headline: "First to respond wins. Always.",
    body: "Studies show 78% of buyers choose the first business to respond. Our AI replies within 90 seconds - on WhatsApp, your website, Facebook, and Instagram - so you're always first, even at 2am.",
    bullets: [
      "90-second average lead response time, 24/7 including weekends",
      "Full conversation in English or Swahili - AI switches automatically",
      "Hot lead alerts sent instantly to your WhatsApp when AI qualifies a buyer",
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
              { from: "ai", msg: "Karibu! Tunao laptops kuanzia KES 35,000. Unataka specs gani? 💻", time: "10:42" },
              { from: "customer", msg: "Core i5, 8GB RAM", time: "10:43" },
              { from: "ai", msg: "Perfect! Tuna Lenovo IdeaPad - KES 42,000. Nitakupeleka catalogu sasa 👉", time: "10:43" },
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
    body: "Monthly AI performance reports show conversations handled, leads qualified, appointments booked, and revenue attributed to AI interactions. No guesswork - pure ROI visibility.",
    bullets: [
      "Conversion analytics updated daily in your dashboard",
      "A/B tested message flows to improve conversion rate monthly",
      "CRM sync - all lead data in HubSpot, Zoho, or Google Sheets",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">AI Performance This Month</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[["Conversations","1,840"],["Leads Qualified","312"],["Appointments","94"],["Converted","68%"]].map(([l,v]) => (
              <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                <div className="font-extrabold text-primary text-sm">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <Zap size={22} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">40 hrs saved per month</div>
            <div className="text-xs text-muted-foreground">Avg time freed for your team</div>
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
      subtext="Our AI platform handles your lead follow-up, customer support, appointment booking, and sales nurturing - 24 hours a day, 7 days a week, in English and Swahili. Stop losing leads to slow responses and scale without hiring."
      serviceType="marketing"
      trustStats={[
        { value: "24/7", label: "AI Always Available" },
        { value: "90s", label: "Average Lead Response Time" },
        { value: "68%", label: "More Leads Converted" },
        { value: "40hrs", label: "Saved Per Business Per Month" },
      ]}
      features={[
        {
          icon: <Bot size={20} />,
          title: "AI Sales Assistant",
          desc: "Qualify leads, answer product questions, and guide prospects through your sales funnel automatically - even at midnight when your team is offline.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "WhatsApp & SMS Automation",
          desc: "Automated WhatsApp Business flows that follow up with new leads, confirm appointments, send reminders, and re-engage cold prospects in natural conversation.",
        },
        {
          icon: <Zap size={20} />,
          title: "Instant Lead Response",
          desc: "Respond to every new lead within 90 seconds - on WhatsApp, your website, Facebook, or Instagram. Speed of response is the biggest factor in lead conversion.",
        },
        {
          icon: <Calendar size={20} />,
          title: "Automated Appointment Booking",
          desc: "Our AI books appointments directly into your calendar, sends confirmations to clients, and sends reminders 24 hours and 1 hour before each meeting.",
        },
        {
          icon: <Users size={20} />,
          title: "CRM Integration & Lead Tracking",
          desc: "All leads automatically logged, scored, and tagged in your CRM. Full conversation history, follow-up sequences, and pipeline visibility for your sales team.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Conversion Analytics",
          desc: "See exactly how many leads the AI handled, how many converted, where prospects dropped off, and what messages perform best - with actionable monthly reports.",
        },
        {
          icon: <Shield size={20} />,
          title: "Human Escalation Protocols",
          desc: "Our AI knows its limits. Complex queries, unhappy customers, and high-value opportunities are seamlessly handed to your human team with full context.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "Swahili & English Support",
          desc: "Fully bilingual AI that switches between English and Swahili based on the customer's preference - because your customers communicate in both languages.",
        },
      ]}
      plans={[
        {
          id: "ai-starter",
          name: "AI Starter",
          price: 15000,
          period: "month",
          features: [
            "AI chatbot for website + WhatsApp",
            "Up to 500 conversations/month",
            "Lead capture & qualification",
            "Basic FAQ automation",
            "Email notification for hot leads",
            "English + Swahili support",
            "Monthly conversation report",
            "Standard setup (5 days)",
          ],
        },
        {
          id: "ai-growth-popular",
          name: "AI Growth",
          price: 35000,
          period: "month",
          features: [
            "AI across website, WhatsApp, Facebook, Instagram",
            "Up to 2,000 conversations/month",
            "Advanced lead qualification flows",
            "Automated follow-up sequences (7-touch)",
            "Appointment booking integration",
            "CRM integration (HubSpot, Zoho, Google Sheets)",
            "Human escalation protocols",
            "A/B testing for message flows",
            "Bi-weekly optimisation sessions",
          ],
        },
        {
          id: "ai-enterprise",
          name: "AI Enterprise",
          price: 70000,
          period: "month",
          features: [
            "Unlimited conversations across all channels",
            "Custom AI trained on your products/services",
            "Full sales pipeline automation",
            "Multi-agent AI team (sales, support, booking)",
            "Voice AI (phone call handling)",
            "M-Pesa payment collection via WhatsApp",
            "Custom integrations via API",
            "Dedicated AI success manager",
            "Weekly performance reviews",
            "Priority 4-hour support response",
          ],
        },
      ]}
      addons={[
        { id: "ai-voice", label: "Voice AI Phone Agent Setup", price: 30000, period: "once" },
        { id: "ai-mpesa", label: "M-Pesa Payments via WhatsApp", price: 20000, period: "once" },
        { id: "ai-crm", label: "Custom CRM Build & Integration", price: 45000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Business Audit", desc: "We map your current lead flow, identify where prospects are dropping off, and design an AI automation strategy that fills the gaps and speeds up conversion." },
        { num: "02", title: "AI Training & Build", desc: "We train the AI on your products, services, pricing, FAQs, and brand voice. Build all conversation flows, integrations, and human escalation paths." },
        { num: "03", title: "Test & Refine", desc: "Full testing across all channels before going live. We run simulated conversations, check escalation triggers, and refine responses based on real data." },
        { num: "04", title: "Launch & Optimise", desc: "Go live, monitor every conversation, and optimise monthly. AI performance improves over time as it handles more real interactions." },
      ]}
      whyPoints={[
        { title: "Kenyan Business Context Built In", desc: "Our AI understands M-Pesa, Kenyan business hours, local terminology, and Swahili - unlike generic chatbot tools built for Western markets." },
        { title: "Never Lose a Lead to Slow Response", desc: "Studies show 78% of buyers choose the company that responds first. Our AI ensures you're always first - even when you're sleeping or in a meeting." },
        { title: "Not a Bot, a Business Tool", desc: "It doesn't just answer FAQs. It qualifies leads, books appointments, collects payments, and hands off complex cases - a full sales and support team member." },
        { title: "Works With Your Existing Tools", desc: "Integrates with Google Calendar, HubSpot, Zoho CRM, Google Sheets, M-Pesa, and hundreds of other tools via Zapier and native APIs." },
        { title: "Pay Less Than One Employee", desc: "A human sales assistant in Nairobi costs KES 40,000–80,000/month plus benefits. Our AI covers the same workload at a fraction of the cost, 24/7." },
        { title: "Your Team Stays Human", desc: "AI handles the repetitive, volume work so your team focuses on high-value relationships, complex deals, and the things that genuinely need a human touch." },
      ]}
      faqs={[
        { q: "Will customers know they're talking to AI?", a: "You choose. We can configure the AI to be transparent, or to operate under your brand. Most clients choose a branded assistant with clear AI disclosure when directly asked." },
        { q: "What happens when the AI can't answer a question?", a: "When it encounters a question outside its knowledge base, or a frustrated customer, it immediately alerts your team via WhatsApp or email with the full conversation context." },
        { q: "Can the AI handle M-Pesa payments through WhatsApp?", a: "Yes - for Enterprise clients. We integrate with the Safaricom Daraja API to enable customers to pay via M-Pesa STK Push directly within a WhatsApp conversation." },
        { q: "How long does setup take?", a: "AI Starter takes 5 business days. Growth takes 10 days. Enterprise takes 2–3 weeks depending on integration complexity. We handle everything." },
        { q: "Can the AI be trained on my specific products and prices?", a: "Yes. During onboarding we collect all your product/service information, pricing, policies, and FAQs. The AI is trained specifically on your business." },
        { q: "Is the conversation data secure?", a: "All conversation data is encrypted, stored securely, and never shared with third parties. You own all your data and can export it at any time." },
      ]}
      ctaHeadline="Let AI Work While You Focus on Growing"
      ctaSubtext="Every minute your team spends answering the same questions is a minute they're not closing deals. Automate the repetitive, amplify the human."
      pricingNote="Monthly subscription. AI improves over time. No setup fee on 3-month commitment."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
