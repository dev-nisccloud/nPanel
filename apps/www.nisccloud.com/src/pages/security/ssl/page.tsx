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
  Lock,
  ShieldCheck,
  Globe,
  Award,
  Zap,
  CheckCircle,
} from "lucide-react";

const sslFaqs = [
  {
    question: "What is an SSL certificate and why do I need one?",
    answer:
      "An SSL (or TLS) certificate encrypts data between your website and visitors, enables HTTPS, and shows the padlock in the browser. Without it, Chrome and other browsers warn that your site is Not Secure, which hurts trust, conversions, and Google rankings.",
  },
  {
    question: "What is the difference between DV, OV, and EV SSL?",
    answer:
      "DV (Domain Validation) proves you control the domain and issues fastest. OV (Organisation Validation) also verifies your business identity. EV (Extended Validation) is the strongest validation level for high-trust sites like e-commerce and finance. Most brochure sites start with DV; growing businesses often choose OV.",
  },
  {
    question: "Does SSL improve SEO?",
    answer:
      "Yes. Google treats HTTPS as a ranking signal. Secure sites avoid browser warnings that cause bounce rates and are better positioned in search results than equivalent HTTP pages.",
  },
  {
    question: "My hosting includes free Let's Encrypt. Why buy a paid SSL?",
    answer:
      "Free certificates are fine for many sites. Paid DV, OV, and EV certificates add higher warranty coverage, organisation validation, dedicated support, and options like Wildcard or Multi-Domain (SAN) that many free setups do not cover as flexibly.",
  },
  {
    question: "Will you install the SSL certificate for me?",
    answer:
      "Yes. Free installation is included. We install the certificate, force HTTPS redirects, fix mixed-content warnings, and confirm the padlock appears correctly across major browsers.",
  },
  {
    question: "What is a Wildcard SSL certificate?",
    answer:
      "A Wildcard SSL secures your main domain and all first-level subdomains under one certificate, for example shop.yourdomain.co.ke and mail.yourdomain.co.ke. It reduces cost and renewal hassle when you run many subdomains.",
  },
  {
    question: "What happens if my SSL certificate expires?",
    answer:
      "Browsers show a full-page warning that blocks most visitors. We send reminders before expiry and can enable auto-renewal so your site never accidentally loses HTTPS protection.",
  },
];

const sslPlans: OrderPlan[] = [
  {
    id: "ssl-dv",
    name: "Domain Validation (DV)",
    price: 1500,
    period: "yr",
    features: [
      "Single domain protection",
      "256-bit encryption",
      "Issued in under 1 hour",
      "Free installation support",
      "Browser padlock & HTTPS",
      "Google SEO support",
      "KES 500,000 warranty",
    ],
  },
  {
    id: "ssl-ov",
    name: "Organisation Validation (OV)",
    price: 3500,
    period: "yr",
    features: [
      "Everything in DV",
      "Business identity verified",
      "Company name in certificate details",
      "Issued in 1–3 business days",
      "KES 1,500,000 warranty",
      "Wildcard option available",
    ],
  },
  {
    id: "ssl-ev",
    name: "Extended Validation (EV)",
    price: 8000,
    period: "yr",
    features: [
      "Highest trust validation level",
      "Ideal for e-commerce & fintech",
      "Issued in 3–5 business days",
      "KES 5,000,000 warranty",
      "Dedicated validation support",
      "Free installation & HTTPS hardening",
    ],
  },
];

const sslFeatures = [
  {
    icon: Lock,
    title: "256-Bit Encryption",
    desc: "Industry-standard AES encryption protects passwords, payment details, and form data in transit between browsers and your server.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Browser Trust Padlock",
    desc: "Remove Not Secure warnings in Chrome, Firefox, Safari, and Edge. Show visitors the padlock that signals a safe connection.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "SEO Ranking Support",
    desc: "HTTPS is a confirmed Google ranking signal. Secure sites avoid warning-driven bounce rates that damage search performance.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Award,
    title: "Trusted Certificate Authorities",
    desc: "Certificates issued by globally recognised CAs, compatible with virtually all browsers, mobile devices, and payment gateways.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Zap,
    title: "Fast Issuance and Setup",
    desc: "DV certificates often issue in under an hour. Our team installs, enforces HTTPS, and clears mixed-content issues for you.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: CheckCircle,
    title: "Wildcard and Multi-Domain Options",
    desc: "Secure unlimited first-level subdomains with Wildcard, or cover several domains with one Multi-Domain (SAN) certificate.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

export default function SslCertificatePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <SecurityHero
        title={
          <>
            Get the HTTPS Padlock
            <br />
            <span className="text-primary">Visitors Trust</span>
          </>
        }
        description="SSL certificates encrypt customer data, remove Not Secure browser warnings, and support stronger Google rankings. Free installation on every plan so HTTPS works the first time."
        imageSrc={niscWebsiteImage("website security.png")}
        imageAlt="SSL Certificate and HTTPS padlock for websites"
        plansId="ssl-certificate-plans"
      />
      <SecurityMacbookSection
        title={
          <>
            Encryption status,
            <br />
            <span className="text-primary">always visible</span>
          </>
        }
        description="Track certificate validity, HTTPS health, and trust signals in one place so your site never quietly falls back to an insecure connection."
        screen={<SecurityDashboardScreen productLabel="SSL Certificate" />}
        srTitle="Nisc Cloud SSL Certificate Dashboard HTTPS and padlock monitoring"
      />
      <SecurityPlans
        sectionId="ssl-certificate-plans"
        plans={sslPlans}
        serviceName="SSL Certificate"
        title="Choose Your SSL Certificate"
        subtitle="Prices are per year. Free installation included. Multi-year discounts available."
      />
      <SecurityFeatures
        title="Everything You Need for Trusted HTTPS"
        description="From first issuance to renewal reminders, we help Kenyan businesses keep the padlock on and customer data encrypted."
        features={sslFeatures}
      />
      <FaqBlock
        faqs={sslFaqs}
        title="Everything you need to know about SSL certificates"
      />
      <SecurityCTA
        title="Secure Your Website With a Trusted SSL Certificate"
        description="Encrypt traffic, earn the browser padlock, and protect checkout and login forms with DV, OV, or EV certificates installed by our team."
        ctaLabel="View SSL Plans"
        plansId="ssl-certificate-plans"
        footnote="Free installation on all plans. Expiry reminders included."
      />
      <Footer />
    </div>
  );
}
