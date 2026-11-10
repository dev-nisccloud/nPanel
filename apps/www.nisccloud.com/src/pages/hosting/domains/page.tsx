import { DomainsStory } from "@/components/artwork/npanel-stories";
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
      showcaseBlocks={[{headline:"From a name to your next website",body:"Search for a domain, review the live availability and registration price, then connect the name to your website or email. This walkthrough illustrates the steps; use the domain search above for current results.",bullets:["Review registration and renewal terms", "Connect your hosting or email", "Keep ownership details current"],visual:"default",artwork:<DomainsStory />,caption:false}]}
      serviceType="hosting"
      plans={[]}
      plansUnderHero
      customPlansSection={<DomainSearchSection />}
      heroImage={niscWebsiteImage("domain.png")}
      heroImageStandalone
      heroCta2="Search Domains"
      heroTrustBadge={{ line1: "KeNIC-accredited registrar", line2: "Free DNS and easy checkout" }}
      trustStats={[
        { value: "Free", label: "DNS Hosting" },
        { value: "200+", label: "TLD Extensions" },
        { value: "60/30/7", label: "Day Renewal Reminders" },
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
          title: "Live Search Across 200+ Extensions",
          desc: "Check live availability with the registries across popular extensions. Smart suggestions appear when your first choice is taken.",
        },
        {
          icon: <Shield size={20} />,
          title: "WHOIS Privacy Where Available",
          desc: "Personal contact details are kept out of public WHOIS results wherever the registry's policy allows. .ke domains follow KeNIC's publication rules.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Auto-Renewal and Expiry Alerts",
          desc: "Renewal reminders at 60, 30 and 7 days before expiry. Turn on auto-renewal so your domain renews before it lapses.",
        },
        {
          icon: <Lock size={20} />,
          title: "Domain Lock and Transfer Protection",
          desc: "Registrar Lock helps prevent unauthorised transfers. Unlock it from your account only when you choose to move a domain.",
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
        { num: "01", title: "Search Your Domain", desc: "Enter any name below and check live availability across .co.ke, .com, .org and 200+ extensions." },
        { num: "02", title: "Buy Now and Pay", desc: "Select your domain, choose a registration period (multi-year rates available), and complete easy checkout." },
        { num: "03", title: "Quick Activation", desc: "Domain is registered after payment. Email confirmation with nameservers and DNS login arrives shortly after." },
        { num: "04", title: "Connect Your Site", desc: "Point DNS to your hosting, set up MX records for email, or connect to any website builder. We help for free." },
      ]}
      whySectionHeadline="Clear Names. Easy Buying."
      whyPoints={[
        { title: "A Clear Name, Easy to Buy", visual: "clarity", desc: "Search, choose, and register in a few steps. Your brand gets a clean online address without the confusion." },
        { title: "Live Prices When You Search", visual: "pricing", desc: "Enter your name to see the exact price for that domain. The price you see in search is the price in your cart, with VAT added at checkout." },
        { title: "Paying Is Simple", visual: "payment", desc: "Easy checkout so you can finish registration quickly and move on to building your site." },
        { title: "Expiry Reminders and Recovery Help", visual: "security", desc: "Reminders at 60, 30 and 7 days before expiry. If a domain does lapse, we help you recover it within the registry's post-expiry period." },
        { title: "Free DNS Hosting Included", visual: "integrate", desc: "DNS hosting is included free with every domain. No separate fees, no extra complexity." },
        { title: "Free Transfer Support", visual: "migration", desc: "Moving a domain from another provider? Our team helps with the process for free. Most transfers complete in 5 to 7 days." },
      ]}
      faqs={[
        { q: "How do I register a .co.ke domain?", a: "Search your domain below, add it to your cart, and complete checkout. The live price appears when you search. Activation follows shortly after payment." },
        { q: "What documents are needed for .co.ke registration?", a: "Most .co.ke domains need a valid local contact. For .or.ke you may need organisation registration proof. For .ac.ke you may need evidence of an educational institution. We guide you through the requirements." },
        { q: "Can I transfer my domain to Nisc Cloud?", a: "Yes. We accept transfers from other registrars and help you through the steps. The process usually takes 5 to 7 days and transfer support is free." },
        { q: "What happens if my domain expires?", a: "We send renewal reminders at 60, 30 and 7 days before expiry. For generic domains such as .com, .net and .org we also send a notice within five days after expiry, as ICANN requires, and the website and email that use the domain stop working. Most expired domains can still be renewed for a limited time after expiry, but the length of that period and any restore fee depend on the extension's registry. .ke domains follow KeNIC's rules. Renew before expiry to avoid any interruption." },
        { q: "Can I register a .go.ke domain for a government entity?", a: "Government entities apply for .go.ke domains under registry rules that require proof of government status, so .go.ke cannot be bought through online checkout. Contact us and we will guide you through the application." },
        { q: "Is Nisc Cloud an accredited .ke registrar?", a: "Yes. Nisc Cloud is a KeNIC-accredited registrar for .ke domains and is licensed by the Communications Authority of Kenya. Your .co.ke and .ke domains are registered directly with the KeNIC registry." },
        { q: "Is WHOIS privacy available for .co.ke domains?", a: "WHOIS publication for .co.ke and other .ke domains follows KeNIC policy. For other extensions, personal details are kept out of public WHOIS results wherever the registry allows." },
      ]}
      ctaHeadline="Secure Your Domain Before It Is Gone"
      ctaSubtext="Search your name now. It takes less than a minute."
    />
  );
}
