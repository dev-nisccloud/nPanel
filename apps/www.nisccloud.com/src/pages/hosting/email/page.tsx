import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";

import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";

import {
  Mail,
  Shield,
  Users,
  Globe,
  Inbox,
  Clock,
  Lock,
  BarChart2,
} from "lucide-react";

import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

import { EmailPricingSection } from "./_components/EmailPricingSection.tsx";
import { BusinessEmailStory } from "@/components/artwork/npanel-stories";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
 {tag:"Nisc Mail",headline:"Your own business inbox. With AI built in.",body:"Nisc Mail is our in-house, cost-friendly business email service. Use your own domain in a dedicated mail client, with AI that drafts replies, helps you write new emails and summarises long messages. Review the wording before you send.",bullets:["AI reply drafting and writing help","Summaries of long emails","Professional addresses on your business domain"],visual:"businessMail",artwork:<BusinessEmailStory />,caption:false},
 {tag:"Protection",headline:"Understand the controls around business mail.",body:"Nisc Mail includes filtering intended to identify malware, spam and phishing, with a 99.9% uptime target. Use the Nisc Mail client for integrated AI tools or connect a currently supported third-party client.",bullets:["Inbound threat and nuisance-mail filtering","99.9% uptime target","Supported client configuration guidance"],visual:"deliverability"},
 {tag:"Hybrid email",headline:"Pay for collaboration where your team needs it.",body:"Keep users who need Microsoft 365 or Google Workspace collaboration on those platforms. Move email-focused users to Nisc Mail on the same company domain. We assess mailbox allocation and mail routing so you can compare the proposed cost with your current setup.",bullets:["One business domain across the agreed platforms","Licences matched to user needs","Savings calculated from your actual licence mix"],visual:"businessMail"},
];

export default function EmailHostingPage() {
  return (
    <ServicePageShell
      badge="Business Email Hosting · Nisc Mail"
      headline={
        <>
          Professional Email That{" "}
          <span className="text-primary">Builds Trust</span> with Every Message
        </>
      }
      subtext="Cost-friendly business email on your own domain. Nisc Mail combines our in-house mail client, integrated AI writing assistance, malware, spam and phishing protection, and a 99.9% uptime target. It also works with supported clients such as Outlook."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<EmailPricingSection />}
      heroImage={niscWebsiteImage("Business email hosting.png")}
      heroImageStandalone
      heroTrustBadge={{
        line1: "DKIM, SPF and DMARC configured",
        line2: "99.9% uptime target · AI-assisted email",
      }}
      trustStats={[
        { value: "99.9%", label: "Uptime Target" },

        { value: "Secure", label: "Business Email" },

        { value: "Scoped", label: "Migration Help" },

        { value: "IMAP", label: "Supported Clients" },
      ]}
      features={[
        {
          icon: <Mail size={20} />,

          title: "Your Own Domain Email",

          desc: "Create professional email addresses like info@yourcompany.co.ke, sales@yourcompany.co.ke, and support@yourcompany.co.ke. Look credible to every client and partner.",
        },

        {
          icon: <Shield size={20} />,

          title: "Spam, Virus and Phishing Filtering",

          desc: "Nisc Mail uses multi-layer filtering to identify spam, phishing and malicious attachments before they reach your team.",
        },

        {
          icon: <Users size={20} />,

          title: "AI Assistance in Your Inbox",

          desc: "In the Nisc Mail client, AI summarises long emails, drafts replies and helps you compose new messages. Review every message before sending.",
        },

        {
          icon: <Globe size={20} />,

          title: "Webmail Access from Anywhere",

          desc: "Use Nisc webmail from a supported browser when you need access away from a configured desktop or mobile client.",
        },

        {
          icon: <Inbox size={20} />,

          title: "IMAP/POP3/SMTP Support",

          desc: "Compatible with Microsoft Outlook, Mozilla Thunderbird and supported Gmail app configurations through standard email protocols. IMAP keeps your folders in step across phone, tablet and desktop.",
        },

        {
          icon: <Clock size={20} />,

          title: "Daily Incremental Backups",

          desc: "Backup schedule, retention and restore scope are defined by the selected plan. Contact support to assess whether a requested message or mailbox can be restored.",
        },

        {
          icon: <Lock size={20} />,

          title: "DKIM, SPF and DMARC Configured",

          desc: "We configure DKIM signatures, SPF records, and DMARC policies for you. Authentication helps receiving providers verify your domain and assess incoming messages.",
        },

        {
          icon: <BarChart2 size={20} />,

          title: "Scoped Mailbox Migration",

          desc: "Moving from another provider? We first confirm source access, mailbox volume, supported data and cutover scope. Any included assistance is limited to that agreed scope.",
        },
      ]}
      plans={[]}
      addons={[]}
      process={[
        {
          num: "01",
          title: "Choose Your Plan",
          desc: "Pick a live plan based on mailbox count, storage and required features. Review the listed inclusions before ordering and move up as the team grows.",
        },

        {
          num: "02",
          title: "Connect Your Domain",
          desc: "Point your domain's MX records to our mail servers. We provide step-by-step instructions and complete the setup for you if preferred.",
        },

        {
          num: "03",
          title: "Create Your Mailboxes",
          desc: "Create mailboxes up to the plan limit, then configure the aliases and forwarding options available to that plan.",
        },

        {
          num: "04",
          title: "Configure Your Devices",
          desc: "Compatible with Microsoft Outlook, Mozilla Thunderbird and supported Gmail app configurations through standard email protocols. Follow our setup guides, or ask us to help configure your team's devices.",
        },
      ]}
      whyPoints={[
        {
          title: "Builds Immediate Credibility", visual: "brand",
          desc: "Emails from you@yourbusiness.co.ke look more professional than free Gmail or Yahoo addresses. Make a stronger first impression from day one.",
        },

        {
          title: "Domain Authentication Setup", visual: "inbox",
          desc: "DKIM, SPF and DMARC configuration helps receiving providers assess messages from your domain; it does not guarantee inbox placement.",
        },

        {
          title: "Nisc Mail Protection", visual: "security",
          desc: "Nisc Mail filtering helps protect business communication against spam, phishing and malicious attachments.",
        },

        {
          title: "Use Supported Mail Clients", visual: "mobile",
          desc: "Standard protocols support common configurations such as Outlook and Thunderbird. Feature availability varies by client and setup.",
        },

        {
          title: "Scales as Your Team Grows", visual: "growth",
          desc: "Create mailboxes up to your plan's limit from your dashboard, and move up a plan as your team grows without changing provider.",
        },

        {
          title: "Support That Understands Business Email", visual: "support",
          desc: "Forwarding rules, aliases or device setup: our team helps you get business email right.",
        },
      ]}
      faqs={[
        {
          q: "Can I migrate from Google Workspace or Microsoft 365?",
          a: "We can assess moves from Google Workspace, Microsoft 365 and compatible IMAP providers. Source access, mailbox volume, supported data, timing and any included assistance are agreed before the cutover.",
        },

        {
          q: "Can I use this with Outlook on Windows?",
          a: "Yes. We provide easy Outlook setup guides for common versions of Outlook. Mailbox setup is supported; calendar, contact and AI features depend on the client and configuration.",
        },

        {
          q: "How is my email secured?",
          a: "Supported connections use TLS in transit, and DKIM, SPF and DMARC are configured to help receiving systems authenticate your domain. These controls reduce risk but cannot prevent every spoofing or phishing attempt.",
        },

        {
          q: "Can I create email aliases (e.g. info@ going to multiple mailboxes)?",
          a: "Alias and forwarding availability depends on the selected plan and configuration. Check the live plan or ask support before designing a group-delivery workflow.",
        },

        {
          q: "What happens to my emails if I cancel?",
          a: "You have 30 days after cancellation to export your data, as set out in our Terms of Service. Mail can be downloaded over IMAP with any standard email client.",
        },

        {
          q: "Do you support bulk or transactional email sending?",
          a: "Our business email plans are designed for team communication. For bulk marketing emails or transactional sending (invoices, receipts), we recommend our separate email marketing service.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Review the live checkout for the selected term, amount billed and renewal basis."
      ctaHeadline="Professional email on your business domain."
      ctaSubtext="Choose a live mailbox plan, connect your domain and agree migration scope and timing where an existing service needs to move."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
