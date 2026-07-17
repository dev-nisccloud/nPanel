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
    answer: "Yes. Without SSL, browsers show a Not Secure warning to visitors, which hurts trust and search rankings. SSL encrypts the connection between your website and your visitors, protecting passwords and payment details.",
  },
  {
    question: "What's the difference between DV, OV, and EV SSL?",
    answer: "DV (Domain Validation) is the fastest and most common. It verifies you own the domain. OV (Organisation Validation) also verifies your business identity. EV (Extended Validation) is the highest validation level and can show your company name in the address bar. For most businesses, DV or OV is enough.",
  },
  {
    question: "How does malware scanning work?",
    answer: "Our automated system scans your website up to 4 times per day for malware, suspicious code, backdoors, and blacklist status. If anything is detected, you get an alert and our security team can clean your site depending on your plan.",
  },
  {
    question: "What is a Web Application Firewall (WAF)?",
    answer: "A WAF sits in front of your website and monitors incoming traffic. It blocks common attacks like SQL injection, cross-site scripting (XSS), and brute force attempts before they reach your site, helping protect you 24/7.",
  },
  {
    question: "How quickly can you clean a hacked website?",
    answer: "For active website security plan subscribers, our team typically begins remediation within 4 business hours of a confirmed hack. Full cleanup usually takes 24 to 48 hours. Premium plan subscribers get a priority response.",
  },
  {
    question: "Are the backups stored off-site?",
    answer: "Yes. All backups are stored in encrypted, geographically separate data centres from your website. Even if your hosting server fails, your backup remains safe and restorable.",
  },
  {
    question: "Can I add security to an existing website?",
    answer: "Yes. You can add website security and SSL to any existing website hosted anywhere, not just sites hosted with us. Purchase a plan and our team will guide you through setup.",
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
