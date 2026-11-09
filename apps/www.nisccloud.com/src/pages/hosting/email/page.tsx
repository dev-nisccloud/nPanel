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

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
 {tag:"Nisc Mail",headline:"Your own business inbox. With AI built in.",body:"Nisc Mail is our in-house, cost-friendly business email service. Use your own domain in a dedicated mail client, with AI that drafts replies, helps you write new emails and summarises long messages. Review the wording before you send.",bullets:["AI reply drafting and writing help","Summaries of long emails","Professional addresses on your business domain"],visual:"businessMail"},
 {tag:"Protection",headline:"Everyday email with protection built in.",body:"Nisc Mail includes malware, spam and phishing protection, with a 99.9% uptime target. Connect your mailbox to supported email clients such as Outlook, or use the Nisc Mail client for its integrated AI tools.",bullets:["Malware, spam and phishing protection","99.9% uptime target","Outlook and Thunderbird configuration support"],visual:"deliverability"},
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

        { value: "Free", label: "Migration Help" },

        { value: "IMAP", label: "Works With Any Client" },
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

          desc: "Access your email from any browser via Nisc webmail. Work from wherever your business takes you.",
        },

        {
          icon: <Inbox size={20} />,

          title: "IMAP/POP3/SMTP Support",

          desc: "Compatible with Microsoft Outlook, Mozilla Thunderbird and supported Gmail app configurations through standard email protocols. IMAP keeps your folders in step across phone, tablet and desktop.",
        },

        {
          icon: <Clock size={20} />,

          title: "Daily Incremental Backups",

          desc: "Mailboxes are backed up daily with incremental backups. If mail is lost, contact support and we will help restore it from the latest backup.",
        },

        {
          icon: <Lock size={20} />,

          title: "DKIM, SPF and DMARC Configured",

          desc: "We configure DKIM signatures, SPF records, and DMARC policies for you. Authentication helps receiving providers verify your domain and assess incoming messages.",
        },

        {
          icon: <BarChart2 size={20} />,

          title: "Free Mailbox Migration",

          desc: "Moving from another provider? We migrate your existing mailboxes at no charge. Timing depends on the number of mailboxes and the amount of mail.",
        },
      ]}
      plans={[]}
      addons={[]}
      process={[
        {
          num: "01",
          title: "Choose Your Plan",
          desc: "Pick a plan based on how many team members need email. All plans include spam filtering, webmail, and IMAP sync. Scale mailboxes as your team grows.",
        },

        {
          num: "02",
          title: "Connect Your Domain",
          desc: "Point your domain's MX records to our mail servers. We provide step-by-step instructions and complete the setup for you if preferred.",
        },

        {
          num: "03",
          title: "Create Your Mailboxes",
          desc: "From your control panel, create mailboxes for every team member, up to your plan's limit. Set aliases and forwarding rules as needed.",
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
          title: "Deliverability-First Infrastructure", visual: "inbox",
          desc: "DKIM, SPF and DMARC are configured for you, helping receiving providers trust your domain so your emails reach inboxes rather than junk folders.",
        },

        {
          title: "Nisc Mail Protection", visual: "security",
          desc: "Nisc Mail filtering helps protect business communication against spam, phishing and malicious attachments.",
        },

        {
          title: "Works with Any Device or App", visual: "mobile",
          desc: "Compatible with Microsoft Outlook, Mozilla Thunderbird and supported Gmail app configurations through standard email protocols. No proprietary client required.",
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
          a: "Yes. We migrate your existing mailboxes from Google Workspace, Microsoft 365 or any IMAP provider at no charge. Timing depends on the number of mailboxes and the amount of mail, and we agree a cut-over time with you.",
        },

        {
          q: "Can I use this with Outlook on Windows?",
          a: "Yes. We provide easy Outlook setup guides for common versions of Outlook. Mailbox setup is supported; calendar, contact and AI features depend on the client and configuration.",
        },

        {
          q: "How is my email secured?",
          a: "All email is encrypted in transit using TLS. We configure DKIM, SPF, and DMARC to prevent spoofing.",
        },

        {
          q: "Can I create email aliases (e.g. info@ going to multiple mailboxes)?",
          a: "Yes. Email aliases and forwarding rules are included on all plans. Set info@yourbusiness.co.ke to deliver to your entire sales team simultaneously.",
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
      pricingNote="Prices in KES excluding 16% VAT. The same monthly rate applies on every billing term."
      ctaHeadline="Professional email on your business domain."
      ctaSubtext="New mailboxes are usually ready in approximately 30 minutes. Migration timing depends on the number of mailboxes and the amount of mail."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
