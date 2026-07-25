import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Globe, Shield, RefreshCw, Lock, Award, Zap, Search } from "lucide-react";
import { DomainSearchSection } from "./_components/DomainSearchSection.tsx";

export default function DomainsPage() {
  return (
    <ServicePageShell
      badge="Domain Registration"
      headline={<>Find a Clear Name. <span className="text-primary">Buy It Easily.</span></>}
      subtext="Register .co.ke, .com, .org and 200+ extensions with simple search and easy checkout. Your brand gets a name that is clear, memorable, and ready to connect to hosting or email."
      serviceType="hosting"
      plans={[]}
      plansUnderHero
      customPlansSection={<DomainSearchSection />}
      heroImage={niscWebsiteImage("domain.png")}
      heroImageStandalone
      heroCta2="Search Domains"
      heroTrustBadge={{ line1: "Free WHOIS Privacy", line2: "Easy checkout and free DNS" }}
      trustStats={[
        { value: "100+", label: "Clients Trust Us" },
        { value: "200+", label: "TLD Extensions" },
        { value: "24/7", label: "Support" },
        { value: "Easy", label: "Checkout" },
      ]}
      features={[
        {
          icon: <Globe size={20} />,
          title: "Clear Naming for Your Brand",
          desc: "Find a name that fits your business. Register .co.ke, .com, .org, .africa and many more from one simple search.",
        },
        {
          icon: <Search size={20} />,
          title: "Instant Search Across 200+ Extensions",
          desc: "Check availability across popular extensions in seconds. Smart suggestions appear when your first choice is taken.",
        },
        {
          icon: <Shield size={20} />,
          title: "Free WHOIS Privacy",
          desc: "Keep your personal details off the public WHOIS database. Privacy protection is included free on all eligible extensions.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Auto-Renewal and Expiry Alerts",
          desc: "Email and SMS reminders at 90, 30, and 7 days before expiry. Enable auto-renewal and your domain stays secured.",
        },
        {
          icon: <Lock size={20} />,
          title: "Domain Lock and Transfer Protection",
          desc: "Registrar Lock helps prevent unauthorised transfers. Pair with 2FA on your account for stronger domain security.",
        },
        {
          icon: <Award size={20} />,
          title: "Free DNS Included",
          desc: "Full DNS management for A, CNAME, MX, TXT, and SRV records. Update records easily without zone-file headaches.",
        },
        {
          icon: <Zap size={20} />,
          title: "Easy Checkout, Quick Activation",
          desc: "Paying is simple. After checkout, your domain is activated and you get confirmation with nameservers and DNS access.",
        },
        {
          icon: <Globe size={20} />,
          title: "Help With Special Extensions",
          desc: "Need .or.ke, .ac.ke, or .go.ke? We guide you through the requirements and help you complete registration smoothly.",
        },
      ]}
      process={[
        { num: "01", title: "Search Your Domain", desc: "Enter any name below and instantly check availability across .co.ke, .com, .org and 200+ extensions." },
        { num: "02", title: "Buy Now and Pay", desc: "Select your domain, choose a registration period (multi-year rates available), and complete easy checkout." },
        { num: "03", title: "Quick Activation", desc: "Domain is registered after payment. Email confirmation with nameservers and DNS login arrives shortly after." },
        { num: "04", title: "Connect Your Site", desc: "Point DNS to your hosting, set up MX records for email, or connect to any website builder. We help for free." },
      ]}
      whySectionHeadline="Clear Names. Easy Buying."
      whyPoints={[
        { title: "A Clear Name, Easy to Buy", desc: "Search, choose, and register in a few steps. Your brand gets a clean online address without the confusion." },
        { title: "Live Prices When You Search", desc: "Enter your name to see the exact price for that domain. What you see in search is what you pay at checkout." },
        { title: "Paying Is Simple", desc: "Easy checkout so you can finish registration quickly and move on to building your site." },
        { title: "Expiry Protection and 30-Day Grace Period", desc: "Expired domains are held for 30 days before release. We exhaust renewal reminders before any domain is lost." },
        { title: "Free DNS Hosting Included", desc: "DNS hosting is included free with every domain. No separate fees, no extra complexity." },
        { title: "Free Transfer Support", desc: "Moving a domain from another provider? Our team helps with the process for free. Most transfers complete in 5 to 7 days." },
      ]}
      faqs={[
        { q: "How do I register a .co.ke domain?", a: "Search your domain below, add it to your cart, and complete checkout. The live price appears when you search. Activation follows shortly after payment." },
        { q: "What documents are needed for .co.ke registration?", a: "Most .co.ke domains need a valid local contact. For .or.ke you may need organisation registration proof. For .ac.ke you may need evidence of an educational institution. We guide you through the requirements." },
        { q: "Can I transfer my domain to Nisc Cloud?", a: "Yes. We accept transfers from other registrars and help you through the steps. The process usually takes 5 to 7 days and transfer support is free." },
        { q: "What happens if my domain expires?", a: "You receive reminders at 90, 30, and 7 days before expiry. After expiry your domain enters a 30-day grace period where you can still renew at the standard rate." },
        { q: "Can I register a .go.ke domain for a government entity?", a: "Yes. Government entities can register .go.ke domains through us. The process requires documentation confirming government status, and we help you complete it." },
        { q: "Is WHOIS privacy available for .co.ke domains?", a: "WHOIS privacy for .co.ke domains follows registry policy. We provide the maximum available privacy protection for all extensions we support." },
      ]}
      ctaHeadline="Secure Your Domain Before It Is Gone"
      ctaSubtext="100+ clients trust us to protect their domain names. Search yours now. It takes less than a minute."
    />
  );
}
