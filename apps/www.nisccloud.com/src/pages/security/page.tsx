import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import SecurityHero from "./_components/SecurityHero.tsx";
import SecurityMacbookSection from "./_components/SecurityMacbookSection.tsx";
import SecurityPlans from "./_components/SecurityPlans.tsx";
import SecurityFeatures from "./_components/SecurityFeatures.tsx";
import SecurityCTA from "./_components/SecurityCTA.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";

const securityFaqs = [
  {
    question: "Do I need an SSL certificate for my website?",
    answer: "Yes — absolutely. Without SSL, browsers show a 'Not Secure' warning to your visitors, which damages trust and hurts your Google rankings. SSL encrypts the connection between your website and your visitors, protecting sensitive data like passwords and payment details.",
  },
  {
    question: "What's the difference between DV, OV, and EV SSL?",
    answer: "DV (Domain Validation) is the fastest and most common — it just verifies you own the domain. OV (Organisation Validation) also verifies your business identity, building more trust. EV (Extended Validation) provides the highest level of validation and shows your company name in the address bar. For most Kenyan businesses, DV or OV is sufficient.",
  },
  {
    question: "How does malware scanning work?",
    answer: "Our automated system scans your website up to 4 times per day for malware, suspicious code injections, backdoors, and blacklist status. If anything is detected, you receive an immediate alert and our security experts clean your site depending on your plan.",
  },
  {
    question: "What is a Web Application Firewall (WAF)?",
    answer: "A WAF sits in front of your website and monitors all incoming traffic. It blocks common attacks like SQL injection, cross-site scripting (XSS), and brute force attempts before they reach your site — protecting you 24/7 without any action required on your part.",
  },
  {
    question: "How quickly can you clean a hacked website?",
    answer: "For active website security plan subscribers, our team typically begins remediation within 4 business hours of a confirmed hack. The full cleanup process usually takes 24–48 hours. Premium plan subscribers get a priority SLA response.",
  },
  {
    question: "Are the backups stored off-site?",
    answer: "Yes. All backups are stored in encrypted, geographically separate data centres from your website. Even if your hosting server fails completely, your backup remains safe and restorable.",
  },
  {
    question: "Can I add security to an existing website?",
    answer: "Yes. You can add website security and SSL to any existing website hosted anywhere — not just Nisc Cloud hosted sites. Simply purchase a plan and our team will guide you through the setup process.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <SecurityHero />
      <SecurityMacbookSection />
      <SecurityPlans />
      <SecurityFeatures />
      <FaqBlock
        faqs={securityFaqs}
        badge="Security FAQ"
        title="Everything you need to know about website security"
      />
      <SecurityCTA />
      <Footer />
    </div>
  );
}
