import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import SecurityHero from "../_components/SecurityHero.tsx";
import SecurityMacbookSection from "../_components/SecurityMacbookSection.tsx";
import SecurityPlans from "../_components/SecurityPlans.tsx";
import SecurityFeatures from "../_components/SecurityFeatures.tsx";
import {
  EmailGateArtwork,
  EmailSecurityScreen,
} from "../_components/EmailSecurityArtwork.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import {
  ShieldCheck,
  MailWarning,
  Ban,
  ScanLine,
  Lock,
  Inbox,
} from "lucide-react";

const emailFaqs = [
  {
    question: "What is email security and why does my business need it?",
    answer:
      "Email security adds filtering and monitoring for spam, phishing, malware attachments, and business email compromise. One malicious message can steal passwords, spread ransomware, or trick staff into wiring money. Managed controls help identify and quarantine suspected threats before delivery, but they cannot remove every risk.",
  },
  {
    question: "How does anti-phishing protection work?",
    answer:
      "Our filters check sender reputation, domain authentication (SPF, DKIM, and DMARC), link destinations, and message content. Suspected messages can be quarantined or tagged to reduce the likelihood of employees opening fake login pages or invoice scams.",
  },
  {
    question: "Will legitimate emails still get through?",
    answer:
      "The filters are tuned to separate likely threats from legitimate customer and supplier mail, but no filter can eliminate every false positive. Quarantine review, trusted-sender lists, and adjustable rules give your team control over held messages.",
  },
  {
    question: "Does email security work with Microsoft 365 and Google Workspace?",
    answer:
      "It can work with supported Microsoft 365, Google Workspace, and hosted business email configurations. We verify your domain, mail flow, administrative access, and provider compatibility before changing delivery settings.",
  },
  {
    question: "What is DMARC and do I need it?",
    answer:
      "DMARC tells receiving servers how to treat messages that fail SPF or DKIM checks. Publishing a DMARC policy helps stop spoofed emails that pretend to come from your domain, protecting your brand and customers from phishing in your name.",
  },
  {
    question: "Can you stop ransomware arriving by email?",
    answer:
      "Email is a common ransomware path. Malware scanning can detect and block known dangerous attachments and suspicious links during mail processing, reducing risk without guaranteeing that every ransomware attempt will be stopped.",
  },
  {
    question: "How quickly can email security be set up?",
    answer:
      "Setup time depends on DNS access, the current mail provider, mailbox count, and any change-control requirements. After confirming the scope, we update the agreed mail-routing settings, review SPF/DKIM/DMARC, validate delivery, and hand over the included quarantine and reporting access.",
  },
];

const emailPlans: OrderPlan[] = [
  {
    id: "email-standard",
    name: "Email Security Standard",
    price: 1500,
    period: "mo",
    features: [
      "Protect up to 10 mailboxes",
      "Spam & phishing filtering",
      "Malware attachment scanning",
      "Quarantine & release portal",
      "SPF, DKIM & DMARC guidance",
      "Daily threat summary reports",
    ],
  },
  {
    id: "email-advanced",
    name: "Email Security Advanced",
    price: 3500,
    period: "mo",
    features: [
      "Everything in Standard",
      "Protect up to 50 mailboxes",
      "Advanced anti-spoofing rules",
      "URL rewrite & click-time checks where supported",
      "Priority incident support",
      "Monthly security review call",
    ],
  },
];

const emailFeatures = [
  {
    icon: Ban,
    title: "Spam and Junk Filtering",
    desc: "Filter bulk spam and unwanted newsletters so your team spends less time on inbox cleanup and more time on customer and partner messages.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: MailWarning,
    title: "Phishing and Spoof Defence",
    desc: "Identify suspicious invoices, credential-harvesting links, and lookalike domains for filtering or quarantine. Strengthen domain authentication with SPF, DKIM, and DMARC.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: ScanLine,
    title: "Malware Attachment Scanning",
    desc: "Inspect supported attachment types for known trojans, malicious macros, and ransomware indicators. Suspected files can be blocked or isolated for review.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Lock,
    title: "Encrypted Message Transport",
    desc: "Enforce TLS where supported so messages travel encrypted between servers, reducing eavesdropping risk on the public internet.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Inbox,
    title: "Quarantine You Control",
    desc: "Review held messages, release false positives, and whitelist trusted senders from a simple portal without waiting on IT tickets.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ShieldCheck,
    title: "Business Email Compromise Alerts",
    desc: "Flag unusual CEO/finance impersonation patterns and sudden rule changes that often signal account takeover attempts.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function EmailSecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main id="main-content">
      <SecurityHero
        title={
          <>
            Catch Suspected Phishing Before
            {" "}<br />
            <span className="text-primary">It Reaches Your Inbox</span>
          </>
        }
        description="Business email security that filters spam, identifies suspected phishing, scans supported attachments for malware, and strengthens SPF, DKIM, and DMARC against domain spoofing."
        visual={<EmailGateArtwork />}
        plansId="email-security-plans"
      />
      <SecurityMacbookSection
        title={
          <>
            Threat signals reviewed,
            {" "}<br />
            <span className="text-primary">during mail processing</span>
          </>
        }
        description="See suspected spam, phishing, and malicious attachments identified during mail processing so your team can review threats without losing sight of real work."
        screen={<EmailSecurityScreen />}
        srTitle="Nisc Cloud Email Security quarantine, domain authentication and daily totals"
      />
      <SecurityPlans
        sectionId="email-security-plans"
        plans={emailPlans}
        serviceName="Email Security"
        title="Choose Your Email Protection"
        subtitle="Designed for supported Microsoft 365, Google Workspace, and hosted business email configurations."
      />
      <SecurityFeatures
        title="Inbox Protection for Real Attack Paths"
        description="Layered email security designed for Kenyan businesses that rely on email for invoices, approvals, and customer support."
        features={emailFeatures}
      />
      <FaqBlock
        faqs={emailFaqs}
        title="Everything you need to know about email security"
      />
      <ClosingCta
        eyebrow="Stay protected"
        headline="Protect Every Mailbox Your Business Depends On"
        subtext="Add managed spam filtering, anti-phishing, malware scanning, and domain authentication to reduce the risk that one malicious email disrupts your company."
        primary={{ label: "View Email Security Plans", href: "#email-security-plans" }}
        secondary={{ label: "Talk to an Expert", href: "/contact" }}
        points={["Setup guidance included", "Pay with M-Pesa or card"]}
        details={{ variant: "shield" }}
      />
      </main>
      <Footer />
    </div>
  );
}
