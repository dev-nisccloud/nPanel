import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Archive, AtSign, BadgeCheck, Forward, Mail, MonitorSmartphone, Shield, Sparkles } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { EmailPricingSection } from "./_components/EmailPricingSection.tsx";
import { BusinessEmailHeroArt } from "./_components/BusinessEmailHeroArt.tsx";
import { EmailComparison, EmailExplained, EmailPlanFit, EmailSetup } from "./_components/email-content.tsx";
import { BusinessEmailStory } from "@/components/artwork/npanel-stories";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Nisc Mail",
    headline: "Your own business inbox, with AI built in.",
    body: "Nisc Mail is our in-house business email service. Use your own domain in a dedicated mail client, with AI that drafts replies, helps you write new emails and summarises long threads. You review every message before it goes.",
    bullets: ["AI reply drafting and writing help", "Summaries of long email threads", "Professional addresses on your business domain"],
    visual: "businessMail",
    artwork: <BusinessEmailStory />,
    caption: false,
  },
  {
    tag: "Protection",
    headline: "Filtering and sender checks on every mailbox.",
    body: "Every plan filters incoming mail for spam, viruses and phishing, and we set up DKIM, SPF and DMARC so receiving inboxes can confirm your messages really come from you. Mail is backed up daily, on a 99.9% uptime target.",
    bullets: ["Spam, virus and phishing filtering", "DKIM, SPF and DMARC set up for you", "Daily backups and a 99.9% uptime target"],
    visual: "deliverability",
  },
];

export default function EmailHostingPage() {
  return (
    <ServicePageShell
      badge="Business Email Hosting · Nisc Mail"
      headline={
        <>
          Business email on your own domain, with <span className="text-primary">AI that drafts your replies</span>
        </>
      }
      subtext="Nisc Mail gives your team addresses like you@yourbusiness.co.ke, with an AI writing assistant, spam and phishing filtering, daily backups and sender records set up for you. Use it in our mail client, Outlook or your phone."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<EmailPricingSection />}
      heroIllustration={<BusinessEmailHeroArt />}
      heroIllustrationBare
      trustStats={[
        { value: "99.9%", label: "Uptime Target" },
        { value: "DKIM · SPF · DMARC", label: "Set Up for You" },
        { value: "IMAP", label: "Outlook & Phone Apps" },
        { value: "AI", label: "Writing Assistant" },
      ]}
      features={[
        {
          icon: <AtSign size={20} />,
          title: "Email on your own domain",
          desc: "Addresses like info@, sales@ and your own name at yourbusiness.co.ke, created from your nPanel account.",
        },
        {
          icon: <Sparkles size={20} />,
          title: "AI writing assistant",
          desc: "In the Nisc Mail client, AI drafts replies, helps you write new messages and summarises long threads. You approve every message.",
        },
        {
          icon: <Shield size={20} />,
          title: "Spam, virus and phishing filtering",
          desc: "Multi-layer filtering checks incoming mail for spam, phishing and malicious attachments before it reaches your team.",
        },
        {
          icon: <BadgeCheck size={20} />,
          title: "DKIM, SPF and DMARC Set Up",
          desc: "We add the records that let receiving inboxes verify your domain. They help with trust; no provider can guarantee inbox placement.",
        },
        {
          icon: <MonitorSmartphone size={20} />,
          title: "Outlook, Thunderbird and phone apps",
          desc: "IMAP, POP and secure SMTP work with Outlook, Thunderbird and phone mail apps. IMAP keeps folders in step on every device.",
        },
        {
          icon: <Forward size={20} />,
          title: "Aliases and forwarding",
          desc: "Point info@ or sales@ at the right people, and forward mail where it needs to go, on every plan.",
        },
        {
          icon: <Archive size={20} />,
          title: "Daily backups",
          desc: "Mail is backed up daily. Contact support to check whether a particular message or mailbox can be restored.",
        },
        {
          icon: <Mail size={20} />,
          title: "Free migration from your current provider",
          desc: "We move your existing mailboxes free of charge, after confirming access, mailbox volume and the switch-over date with you.",
        },
      ]}
      plans={[]}
      addons={[]}
      process={[
        {
          num: "01",
          title: "Choose your plan",
          desc: "Pick a plan by how many mailboxes and how much storage your team needs, and move up as you grow.",
        },
        {
          num: "02",
          title: "Connect your domain",
          desc: "Point your domain's MX record to Nisc Mail. We send step-by-step instructions, or set it up for you.",
        },
        {
          num: "03",
          title: "Create your mailboxes",
          desc: "Create mailboxes up to your plan's limit, then add aliases and forwarding.",
        },
        {
          num: "04",
          title: "Sign in on your devices",
          desc: "Use the Nisc Mail client, or add the account to Outlook, Thunderbird or your phone with our setup guides.",
        },
      ]}
      whyPoints={[
        {
          title: "Look established from the first email",
          visual: "brand",
          desc: "A quote from sales@yourbusiness.co.ke earns more trust than the same quote from a free Gmail or Yahoo address.",
        },
        {
          title: "Mailboxes stay with the business",
          visual: "security",
          desc: "When someone leaves, their mailbox and customer conversations stay with you, ready to forward or reassign.",
        },
        {
          title: "Grows with your team",
          visual: "growth",
          desc: "Add mailboxes up to your plan's limit from nPanel, and move up a plan without changing provider.",
        },
        {
          title: "Help with the fiddly parts",
          visual: "support",
          desc: "Domain records, aliases, forwarding or device setup: our team helps you get it right.",
        },
      ]}
      whySectionHeadline="Why businesses move their email to Nisc Mail"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <EmailPlanFit />,
        afterShowcase: <EmailComparison />,
        afterProcess: <EmailSetup />,
        beforeFaq: <EmailExplained />,
      }}
      faqTitle="Business email questions"
      faqs={[
        {
          q: "What is included with every business email plan?",
          a: "Every plan includes email on your own domain, the AI writing assistant, spam, virus and phishing filtering, DKIM, SPF and DMARC set up for you, IMAP, POP and SMTP access, aliases and forwarding, daily backups, free migration and a 99.9% uptime target. Plans differ by mailbox count and storage.",
        },
        {
          q: "Do I need a website to get business email?",
          a: "No. You only need a domain name. Your website can stay with its current host, or you can add one later.",
        },
        {
          q: "Will I lose email while switching my domain to Nisc Mail?",
          a: "The switch is planned so mail keeps arriving. We agree the switch-over time with you and update your MX record then; DNS changes can take a few hours to reach every network.",
        },
        {
          q: "Can I migrate from Google Workspace or Microsoft 365?",
          a: "Yes, and migration is free. We move mail from Google Workspace, Microsoft 365 and other IMAP providers. Source access, mailbox volume, what moves across and the switch-over date are agreed before we start.",
        },
        {
          q: "Can I use my business email on my phone?",
          a: "Yes. Add the account to your phone's mail app over IMAP and secure SMTP, using our setup guides. Folders stay in step between your phone and computer.",
        },
        {
          q: "Can I use this with Outlook on Windows?",
          a: "Yes. We provide Outlook setup guides for common versions. Mailbox setup is supported; calendar, contacts and AI features depend on the client you use.",
        },
        {
          q: "Can info@ deliver to several people?",
          a: "Yes. Every plan includes aliases and forwarding, so info@ or sales@ can deliver into the mailboxes of the people who handle them.",
        },
        {
          q: "How much storage does each plan have?",
          a: "Storage and mailbox counts are shown on each plan card above. Corporate is sized to your organisation when you need more than 100 mailboxes or custom storage.",
        },
        {
          q: "How is my email protected from spam and phishing?",
          a: "Incoming mail is filtered for spam, viruses and phishing, supported connections use TLS, and DKIM, SPF and DMARC help receiving systems verify your domain. These controls reduce risk but cannot stop every attempt, so stay alert to unexpected payment requests.",
        },
        {
          q: "Will my emails land in the inbox, not spam?",
          a: "Setting up DKIM, SPF and DMARC gives your mail the best start, but no provider can guarantee inbox placement. Message content, sending volume and the recipient's own filters also play a part.",
        },
        {
          q: "What happens to my emails if I cancel?",
          a: "You have 30 days after cancellation to export your data, as set out in our Terms of Service. Mail can be downloaded over IMAP with any standard email client.",
        },
        {
          q: "Can I send newsletters or invoices in bulk?",
          a: "Business email is designed for team communication. For newsletters and bulk campaigns, use our email marketing service.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Review the live checkout for the selected term, amount billed and renewal basis."
      ctaHeadline="Professional email on your business domain."
      ctaSubtext="Pick a plan for your team, connect your domain and start sending from addresses your customers trust."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
