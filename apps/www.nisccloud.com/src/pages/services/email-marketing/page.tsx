import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { EmailMarketingPricingSection } from "@/pages/services/email-marketing/_components/EmailMarketingPricingSection.tsx";
import { OutreachProductFamily } from "@/pages/services/email-marketing/_components/OutreachProductFamily.tsx";
import { BarChart2, MessageSquare, Palette, Target } from "lucide-react";
import { CapabilityGroups, type CapabilityGroup } from "@/pages/services/_components/CapabilityGroups.tsx";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { EmailMarketingStory } from "@/components/artwork/npanel-stories";
import { OutreachStory } from "@/components/artwork/npanel-stories/ai-stories.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";

const OUTREACH_GROUPS: CapabilityGroup[] = [
  {
    icon: Palette,
    title: "Starts from your brand",
    body: "Add your domain and Outreach fetches your logo and brand colours. No website yet? Describe your business and what you sell.",
    example: "We're Savanna Bakery in Nairobi. Our site is savannabakery.com, use our colours.",
    items: [
      "Logo and brand colours fetched from your website",
      "Works from a short description if you have no site",
      "Brand kits and a media library for your images",
      "Every template designed to match your business",
    ],
  },
  {
    icon: Target,
    title: "Built around your objective",
    body: "Choose the kind of email, then say what you want it to achieve. The design, wording and button follow that goal.",
    example: "End-year sale: 20% off all cakes until 31 December, for our regular customers.",
    items: [
      "Promotion or sale, such as an end-year campaign",
      "Welcome emails for new customers",
      "A monthly newsletter",
      "Transactional updates about orders and accounts",
    ],
  },
  {
    icon: MessageSquare,
    title: "Edit by chatting",
    body: "Approve the design or ask for changes in plain words. Generate a new variation when you want another direction.",
    example: "Make the headline shorter and put the offer above the photo.",
    items: [
      "Changes in plain words, no editor to learn",
      "New variations on request",
      "You approve before anything is sent",
    ],
  },
  {
    icon: BarChart2,
    title: "Sends from you, reports back",
    body: "Pick an audience and send from your own verified domain. Each campaign gets its own report in nPanel.",
    example: "Send it to the Regular customers list on Friday morning.",
    items: [
      "Audiences with bulk contact import",
      "Sends from your business domain, not a shared one",
      "Delivered, opened, clicked, bounced and unsubscribed",
      "Your most clicked links",
    ],
  },
];

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "AI that knows your brand",
    artwork: <OutreachStory />,
    caption: false,
    headline: "Describe your business. The AI designs the campaign.",
    body: "Add your domain or describe what you do, and Outreach fetches your logo and brand colours. Choose the objective, such as an end-year sale or a welcome email, and the AI designs a template that looks like your business. Ask for changes in plain words until it is right.",
    bullets: [
      "Logo and brand colours fetched from your domain",
      "Pick an objective: sale, welcome, newsletter or update",
      "Changes and new variations by chatting",
    ],
    mockupRight: true,
    visual: "automation",
  },
  {
    tag: "Results",
    artwork: <EmailMarketingStory />,
    caption: false,
    headline: "See what happened after you pressed send",
    body: "Every campaign has its own report in nPanel: delivered, opened, clicked, bounced and unsubscribed, plus the links people clicked most. Zepo can read the results with you and suggest what to try next.",
    bullets: [
      "Opens, clicks, bounces and unsubscribes per campaign",
      "Your most clicked links",
      "Next-step ideas from Zepo",
    ],
    mockupRight: false,
    visual: "reporting",
  },
];

export default function EmailMarketingPage() {
  return (
    <ServicePageShell
      badge="Nisc Outreach"
      seoTitle="Nisc Outreach: AI email marketing"
      headline={<>From an idea to an inbox. <br /><span className="text-primary">AI handles the work.</span></>}
      subtext="Describe your business or add your domain. Outreach fetches your brand kit and logo, you choose the objective, and the AI designs, sends and tracks the campaign in nPanel."
      serviceType="marketing"
      primaryCtaLabel="Create your first campaign"
      heroCta2="See how it works"
      heroCta2Href="#how-it-works"
      customPlansSection={<EmailMarketingPricingSection />}
      plans={[]}
      heroImage={niscWebsiteImage("Email marketing.png")}
      heroImageStandalone
      trustStats={[
        { value: "AI", label: "Designs From Your Brand" },
        { value: "Your", label: "Domain As Sender" },
        { value: "Live", label: "Opens And Clicks" },
        { value: "nPanel", label: "One Workspace" },
      ]}
      showcaseBlocks={showcaseBlocks}
      contentSlots={{
        afterShowcase: (
          <>
            <CapabilityGroups
              title={<>Tell it about your business. <span className="text-primary">It does the designing.</span></>}
              intro="Describe what you do or add your domain. Outreach fetches your logo and brand colours, asks what the campaign is for, and designs an email that looks like it came from you."
              exampleLabel="You type"
              groups={OUTREACH_GROUPS}
            />
            <OutreachProductFamily />
          </>
        ),
      }}
      process={[
        { num: "01", title: "Tell it about your business", desc: "Add your domain so it can fetch your logo and colours, or describe what you do." },
        { num: "02", title: "Choose the objective", desc: "A sale, a welcome, a newsletter or an update. Add the details, such as an end-year offer." },
        { num: "03", title: "Review the design", desc: "Approve it or ask for changes in chat. Try a variation if you want another look." },
        { num: "04", title: "Send and track", desc: "Pick the list, send from your verified domain and watch opens and clicks in nPanel." },
      ]}
      faqs={[
        { q: "What is the difference between Nisc Mail and Nisc Outreach?", a: "Nisc Mail is your everyday business email, one person writing to another. Nisc Outreach sends campaigns to many people at once, designed by AI and tracked in a report. You manage both in nPanel." },
        { q: "Does the AI really design the email?", a: "Yes. Add your domain or describe your business, choose the objective and give a short brief. It fetches your logo and brand colours, creates the design and builds the email. You approve it or ask for changes before anything is sent." },
        { q: "What kinds of campaigns can I create?", a: "Choose promotional or sale emails (an end-year sale, for example), welcome emails, a monthly newsletter, or transactional updates about orders and accounts. Then describe the goal in your own words." },
        { q: "Can I bring my existing contacts?", a: "Yes. You can add contacts in bulk to an audience and keep separate lists. Only send to people who agreed to hear from you." },
        { q: "Do I need my own domain?", a: "Campaigns send from a domain you have verified in nPanel, so your emails come from your business address. If you do not have a domain yet, you can register one with Nisc Cloud." },
        { q: "What results can I see?", a: "For each campaign: delivered, opened, clicked, bounced and unsubscribed, a breakdown of bounces, and the links people clicked most." },
        { q: "Can Zepo help with my campaigns?", a: "Yes. Zepo can read your campaign results in nPanel and suggest what to try next, such as a new subject line or a different audience." },
      ]}
      closing={
        <ClosingCta
          headline="Your next campaign starts with one sentence"
          subtext="Pick a plan, tell the AI what you want to send, and watch the results arrive in nPanel."
          primary={{ label: "Create your first campaign", href: "#plans" }}
          secondary={{ label: "See how it works", href: "#how-it-works" }}
          steps={["Choose a Nisc Outreach plan", "Describe your campaign", "Send and track it in nPanel"]}
        />
      }
    />
  );
}
