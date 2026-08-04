import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import SecurityHero from "../_components/SecurityHero.tsx";
import SecurityMacbookSection from "../_components/SecurityMacbookSection.tsx";
import SecurityPlans from "../_components/SecurityPlans.tsx";
import SecurityFeatures from "../_components/SecurityFeatures.tsx";
import SecurityCTA from "../_components/SecurityCTA.tsx";
import SecurityDashboardScreen from "../_components/SecurityDashboardScreen.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
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
      "Email security protects your inbox from spam, phishing, malware attachments, and business email compromise. Without it, one malicious message can steal passwords, spread ransomware, or trick staff into wiring money. Managed email security filters threats before they reach your team.",
  },
  {
    question: "How does anti-phishing protection work?",
    answer:
      "Our filters check sender reputation, domain authentication (SPF, DKIM, and DMARC), link destinations, and message content. Suspicious messages are quarantined or tagged so employees do not click fake login pages or invoice scams.",
  },
  {
    question: "Will legitimate emails still get through?",
    answer:
      "Yes. We tune filters to block threats while delivering real customer and supplier mail. You can review quarantine, whitelist trusted senders, and adjust rules so important messages are not lost.",
  },
  {
    question: "Does email security work with Microsoft 365 and Google Workspace?",
    answer:
      "Yes. We can sit in front of Microsoft 365, Google Workspace, or your hosted business email. Mail is scanned as it arrives, then delivered clean to your existing mailboxes.",
  },
  {
    question: "What is DMARC and do I need it?",
    answer:
      "DMARC tells receiving servers how to treat messages that fail SPF or DKIM checks. Publishing a DMARC policy helps stop spoofed emails that pretend to come from your domain, protecting your brand and customers from phishing in your name.",
  },
  {
    question: "Can you stop ransomware arriving by email?",
    answer:
      "Email is a common ransomware path. Our malware scanning strips or blocks dangerous attachments and suspicious links before they open on employee devices, reducing the chance of encryption attacks starting in the inbox.",
  },
  {
    question: "How quickly can email security be set up?",
    answer:
      "Most businesses are protected within one business day. We update your MX or gateway settings, verify SPF/DKIM/DMARC, run a short monitoring period, then hand over quarantine access and reporting.",
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
      "URL rewrite & click-time protection",
      "Priority incident support",
      "Monthly security review call",
    ],
  },
];

const emailFeatures = [
  {
    icon: Ban,
    title: "Spam and Junk Filtering",
    desc: "Block bulk spam and unwanted newsletters so your team spends time on real customer and partner messages, not inbox cleanup.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: MailWarning,
    title: "Phishing and Spoof Defence",
    desc: "Detect fake invoices, credential-harvesting links, and lookalike domains before staff click. Protect your brand with SPF, DKIM, and DMARC.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: ScanLine,
    title: "Malware Attachment Scanning",
    desc: "Scan every attachment for trojans, macros, and ransomware. Dangerous files are blocked or sandboxed so devices stay clean.",
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
    color: "text-violet-500",
    bg: "bg-violet-500/10",
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
      <SecurityHero
        title={
          <>
            Stop Phishing Before
            <br />
            <span className="text-primary">It Reaches Your Inbox</span>
          </>
        }
        description="Business email security that filters spam, blocks phishing, scans attachments for malware, and hardens SPF, DKIM, and DMARC so criminals cannot spoof your domain."
        imageSrc={niscWebsiteImage("Business email hosting.png")}
        imageAlt="Email Security for business inboxes"
        plansId="email-security-plans"
      />
      <SecurityMacbookSection
        title={
          <>
            Threats filtered,
            <br />
            <span className="text-primary">before they land</span>
          </>
        }
        description="See spam blocked, phishing quarantined, and malware attachments stopped in real time so your team stays focused on real work."
        screen={<SecurityDashboardScreen productLabel="Email Security" />}
        srTitle="Nisc Cloud Email Security Dashboard real-time inbox protection"
      />
      <SecurityPlans
        sectionId="email-security-plans"
        plans={emailPlans}
        serviceName="Email Security"
        title="Choose Your Email Protection"
        subtitle="30-day money-back guarantee. Works with Microsoft 365, Google Workspace, and hosted business email."
      />
      <SecurityFeatures
        title="Inbox Protection That Blocks Real Attacks"
        description="Layered email security designed for Kenyan businesses that rely on email for invoices, approvals, and customer support."
        features={emailFeatures}
      />
      <FaqBlock
        faqs={emailFaqs}
        title="Everything you need to know about email security"
      />
      <SecurityCTA
        title="Protect Every Mailbox Your Business Depends On"
        description="Add managed spam filtering, anti-phishing, malware scanning, and domain authentication so one bad email cannot take down your company."
        ctaLabel="View Email Security Plans"
        plansId="email-security-plans"
      />
      <Footer />
    </div>
  );
}
