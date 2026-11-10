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
      subtext="Search currently supported extensions, review live registry availability and pricing, then register a clear name to connect with your hosting or email."
      showcaseBlocks={[{headline:"From a name to your next website",body:"Search for a domain, review the live availability and registration price, then connect the name to your website or email. This walkthrough illustrates the steps; use the domain search above for current results.",bullets:["Review registration and renewal terms", "Connect your hosting or email", "Keep ownership details current"],visual:"default",artwork:<DomainsStory />,caption:false}]}
      serviceType="hosting"
      plans={[]}
      plansUnderHero
      customPlansSection={<DomainSearchSection />}
      heroImage={niscWebsiteImage("domain.png")}
      heroImageStandalone
      heroCta2="Search Domains"
      heroCta2Href="#pricing"
      heroTrustBadge={{ line1: "KeNIC-accredited registrar", line2: "Free DNS and easy checkout" }}
      trustStats={[
        { value: "Free", label: "DNS Hosting" },
        { value: "Live", label: "Extension Availability" },
        { value: "Account", label: "Renewal Notices" },
        { value: "Easy", label: "Checkout" },
      ]}
      features={[
        {
          icon: <Globe size={20} />,
          title: "Clear Naming for Your Brand",
          desc: "Find a name that fits your business and compare the extensions currently available through the live search.",
        },
        {
          icon: <Search size={20} />,
          title: "Live Registry Search",
          desc: "Check current availability and pricing for supported extensions. Search results determine which names can be registered at that moment.",
        },
        {
          icon: <Shield size={20} />,
          title: "WHOIS Privacy Where Available",
          desc: "Personal contact details are kept out of public WHOIS results wherever the registry's policy allows. .ke domains follow KeNIC's publication rules.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Renewal Management",
          desc: "Use the renewal options and notices available for your account and extension. Keep contact and payment details current and do not rely on a single reminder.",
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
          title: "Clear Checkout and Registration",
          desc: "Review the registration term, registry requirements and live price before payment. Activation follows registry acceptance and any required verification.",
        },
        {
          icon: <Globe size={20} />,
          title: "Help With Special Extensions",
          desc: "Need .or.ke, .ac.ke, or .go.ke? We guide you through the requirements and help you complete registration smoothly.",
        },
      ]}
      process={[
        { num: "01", title: "Search Current Availability", desc: "Enter a name and review the extensions, availability and prices returned by the live search." },
        { num: "02", title: "Review the Registration", desc: "Select the domain, confirm the term, renewal information and any registry requirements, then complete checkout." },
        { num: "03", title: "Complete Registry Checks", desc: "Registration proceeds after payment and any required contact or eligibility verification. Timing varies by extension and registry." },
        { num: "04", title: "Connect Your Services", desc: "Point DNS to hosting, configure email records or connect another supported service. Assistance scope is confirmed when needed." },
      ]}
      whySectionHeadline="Clear Names. Easy Buying."
      whyPoints={[
        { title: "A Clear Name, Easy to Buy", visual: "clarity", desc: "Search, choose, and register in a few steps. Your brand gets a clean online address without the confusion." },
        { title: "Live Prices When You Search", visual: "pricing", desc: "Enter your name to see the exact price for that domain. The price you see in search is the price in your cart, with VAT added at checkout." },
        { title: "Paying Is Simple", visual: "payment", desc: "Easy checkout so you can finish registration quickly and move on to building your site." },
        { title: "Renewal and Recovery Context", visual: "security", desc: "Available notices help you track renewal, while expiry, grace and restore rules remain specific to each registry and extension." },
        { title: "Free DNS Hosting Included", visual: "integrate", desc: "DNS hosting is included free with every domain. No separate fees, no extra complexity." },
        { title: "Transfer Guidance", visual: "migration", desc: "For supported extensions, we can explain eligibility, lock and authorisation steps. Fees, support scope and timing depend on the live transfer and registry rules." },
      ]}
      faqs={[
        { q: "How do I register a .co.ke domain?", a: "Search the name, review live availability and price, add it to the cart and complete checkout. Registration timing depends on registry acceptance and any required contact checks." },
        { q: "What documents are needed for .co.ke registration?", a: "Most .co.ke domains need a valid local contact. For .or.ke you may need organisation registration proof. For .ac.ke you may need evidence of an educational institution. We guide you through the requirements." },
        { q: "Can I transfer my domain to Nisc Cloud?", a: "Use the transfer checker to confirm whether the extension is supported and to see the current price. Eligibility, required steps, assistance scope and completion time vary by registry and current registrar." },
        { q: "What happens if my domain expires?", a: "Available renewal notices depend on the account and extension, so keep your contact details current and track the expiry date directly. Website and email services may stop after expiry; grace, redemption and restore fees vary by registry. .ke domains follow KeNIC rules." },
        { q: "Can I register a .go.ke domain for a government entity?", a: "Government entities apply for .go.ke domains under registry rules that require proof of government status, so .go.ke cannot be bought through online checkout. Contact us and we will guide you through the application." },
        { q: "Is Nisc Cloud an accredited .ke registrar?", a: "Yes. Nisc Cloud is a KeNIC-accredited registrar for .ke domains and is licensed by the Communications Authority of Kenya. Your .co.ke and .ke domains are registered directly with the KeNIC registry." },
        { q: "Is WHOIS privacy available for .co.ke domains?", a: "WHOIS publication for .co.ke and other .ke domains follows KeNIC policy. For other extensions, personal details are kept out of public WHOIS results wherever the registry allows." },
      ]}
      ctaHeadline="Secure Your Domain Before It Is Gone"
      ctaSubtext="Search now to see current availability, registry requirements and live pricing."
    />
  );
}
