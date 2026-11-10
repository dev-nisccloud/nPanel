import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import SecurityHero from "./_components/SecurityHero.tsx";
import SecurityMacbookSection from "./_components/SecurityMacbookSection.tsx";
import SecurityPlans from "./_components/SecurityPlans.tsx";
import SecurityFeatures, { type SecurityFeatureItem } from "./_components/SecurityFeatures.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import { Activity, Database, Flame, Lock, ScanLine, ShieldCheck } from "lucide-react";

const securityPlans: OrderPlan[] = [
  {
    id: "standard",
    name: "Website Security Standard",
    price: 2500,
    period: "mo",
    features: [
      "Protect one website",
      "SSL certificate included",
      "Scheduled malware scanning · cadence confirmed for your plan",
      "Cleanup scope confirmed before activation",
      "Blacklist & SEO spam monitoring",
      "Uptime monitoring & alerts",
    ],
  },
  {
    id: "advanced",
    name: "Website Security Advanced",
    price: 5500,
    period: "mo",
    features: [
      "Everything in Standard",
      "Expanded cleanup scope · allowance confirmed for your plan",
      "Backup capacity, location & retention confirmed before activation",
      "Performance configuration review",
      "DDoS mitigation where included",
      "Web Application Firewall (WAF) for compatible sites",
    ],
  },
];

const securityFeatures: SecurityFeatureItem[] = [
  {
    icon: ShieldCheck,
    title: "SSL Certificate Included",
    desc: "Included SSL enables HTTPS encryption for compatible domains. Certificate validation and coverage are confirmed for the selected plan.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Flame,
    title: "Managed Firewall Rules",
    desc: "A Web Application Firewall can filter known malicious traffic patterns for compatible sites, reducing exposure without guaranteeing prevention of every attack.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: ScanLine,
    title: "Scheduled Malware Scanning",
    desc: "Scan cadence, alerting, and any included cleanup scope are confirmed for your selected plan and website configuration.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Activity,
    title: "Site Monitoring",
    desc: "Available monitoring can track blacklist status, SEO spam indicators, SSL changes, and uptime, with coverage defined by your plan.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Lock,
    title: "DDoS Risk Mitigation",
    desc: "Where included, DDoS controls help absorb or filter disruptive traffic. Protection depends on the service configuration and attack profile.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Database,
    title: "Plan-Defined Backups",
    desc: "Where backups are included, capacity, schedule, retention, storage location, and restore options are confirmed before activation.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const securityFaqs = [
  {
    question: "Do I need an SSL certificate for my website?",
    answer: "Yes. Without SSL, browsers show a Not Secure warning to visitors, which hurts trust and search rankings. SSL encrypts the connection between your website and your visitors, protecting passwords and payment details.",
  },
  {
    question: "What's the difference between DV, OV, and EV SSL?",
    answer: "DV (Domain Validation) is the fastest and most common. It verifies you own the domain. OV (Organisation Validation) also verifies your business identity. EV (Extended Validation) is the strictest validation level and lists your verified company details in the certificate. For most businesses, DV or OV is enough.",
  },
  {
    question: "How does malware scanning work?",
    answer: "Our automated system checks your website for malware, suspicious code, backdoors, and blacklist status. Scan cadence and alerting depend on the selected plan and website configuration; where cleanup is included, our security team can help investigate and remediate confirmed findings.",
  },
  {
    question: "What is a Web Application Firewall (WAF)?",
    answer: "A WAF sits in front of your website and monitors incoming traffic. It applies managed rules that can filter common attack patterns such as SQL injection, cross-site scripting (XSS), and brute-force attempts. It reduces exposure but does not guarantee that every attack will be prevented.",
  },
  {
    question: "How quickly can you clean a hacked website?",
    answer: "Response and cleanup time depend on the severity of the compromise, the website stack, and the access available to our team. We confirm the applicable support priority and remediation scope for your plan before work begins.",
  },
  {
    question: "Are the backups stored off-site?",
    answer: "Where backups are included, storage location, retention, encryption, and restore options depend on the hosting or security plan. We confirm those details for your service before activation; a backup reduces recovery risk but is not a guarantee of restoration in every scenario.",
  },
  {
    question: "Can I add security to an existing website?",
    answer: "Often, yes. SSL and selected security services can be added to compatible websites hosted outside Nisc Cloud, subject to a technical assessment, provider access, and platform support. We confirm eligibility and setup requirements before activation.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main id="main-content">
      <SecurityHero description="Managed SSL, malware scanning, firewall controls, and plan-defined backups that reduce website risk while keeping coverage and service scope clear." />
      <SecurityMacbookSection
        title={
          <>
            Your security controls,
            {" "}<br />
            <span className="text-primary">visible in one place</span>
          </>
        }
        description="Review available firewall, malware scan, SSL, backup, DDoS, and monitoring signals from one security view. Coverage and update cadence depend on your plan."
        srTitle="Nisc Cloud Security Dashboard showing plan-defined website protection controls"
      />
      <SecurityPlans plans={securityPlans} />
      <SecurityFeatures features={securityFeatures} />
      <FaqBlock
        faqs={securityFaqs}
        title="Everything you need to know about website security"
      />
      <ClosingCta
        eyebrow="Stay protected"
        headline="Protect Your Site With Clear, Managed Security"
        subtext="Add plan-defined SSL, malware scanning, firewall controls, and backup options to reduce website risk with a scope confirmed before activation."
        primary={{ label: "View Security Plans", href: "#security-plans" }}
        secondary={{ label: "Talk to an Expert", href: "/contact" }}
        points={["Setup guidance included", "Pay with M-Pesa or card", "Ticket portal available 24/7 · staffed email, chat and phone support during working hours"]}
      />
      </main>
      <Footer />
    </div>
  );
}
