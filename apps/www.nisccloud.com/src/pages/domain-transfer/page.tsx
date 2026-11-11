import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import {
  ArrowLeftRight,
  Shield,
  Headphones,
  Clock,
  Key,
  RefreshCw,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { TransferToolSection } from "./_components/TransferToolSection.tsx";

export default function DomainTransferPage() {
  return (
    <ServicePageShell
      badge="Domain Transfer"
      headline={
        <>
          Move your domain here.{" "}
          <span className="text-primary">We help you through it.</span>
        </>
      }
      subtext="Bring an eligible domain into the same account as your hosting and email. Check live support and pricing, then follow the registry-specific transfer steps with scoped help where needed."
      serviceType="hosting"
      closingCard="brief"
      plans={[]}
      plansUnderHero
      customPlansSection={<TransferToolSection />}
      heroImage={niscWebsiteImage("domain transfer.png")}
      heroImageStandalone
      heroCta2="Check Your Domain"
      heroCta2Href="#pricing"
      heroTrustBadge={{ line1: "Eligibility checked live", line2: "Registry terms shown before purchase" }}
      trustStats={[
        { value: "Live", label: "Transfer Eligibility" },
        { value: "Registry", label: "Completion Timing" },
        { value: "Scoped", label: "Transfer Help" },
        { value: "Clear", label: "Next Steps" },
      ]}
      features={[
        {
          icon: <ArrowLeftRight size={20} />,
          title: "A clear transfer path",
          desc: "Check your domain, see if it can move, then follow a few simple steps. No confusing registrar jargon.",
        },
        {
          icon: <Key size={20} />,
          title: "Auth code made simple",
          desc: "We explain what an authorization code is, where to find it at your current provider, and when to enter it.",
        },
        {
          icon: <Shield size={20} />,
          title: "Safe every step of the way",
          desc: "Your domain stays protected during the move with lock checks and verification before the transfer starts.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Renewal terms by extension",
          desc: "Some registry transfers extend the registration term while others do not. The live result and applicable registry rules determine the outcome.",
        },
        {
          icon: <Globe size={20} />,
          title: "Local and global names",
          desc: "Use the checker to confirm whether a Kenyan or international extension can currently move into your account.",
        },
        {
          icon: <Headphones size={20} />,
          title: "Real help when you need it",
          desc: "Ask for guidance on eligible unlock steps, authorisation codes and status checks within the agreed support scope.",
        },
        {
          icon: <Clock size={20} />,
          title: "Know what happens next",
          desc: "The required approvals and completion window vary by extension, registry and current registrar; we explain the applicable next step.",
        },
        {
          icon: <CheckCircle2 size={20} />,
          title: "One place after the move",
          desc: "When the transfer finishes, manage DNS, renewals, hosting, and email from the same panel.",
        },
      ]}
      process={[
        {
          num: "01",
          title: "Check your domain",
          desc: "Enter your domain above. We confirm if it can transfer and show the live transfer price before you pay.",
        },
        {
          num: "02",
          title: "Unlock and get your code",
          desc: "Turn off transfer lock at your current provider and request your authorization (EPP) code.",
        },
        {
          num: "03",
          title: "Pay and start the move",
          desc: "Add the transfer to cart, enter your auth code, and complete easy checkout. We submit the request for you.",
        },
        {
          num: "04",
          title: "Approve and finish",
          desc: "Complete any approval requested by the current registrar or registry. Timing and final status depend on those parties and the extension.",
        },
      ]}
      whySectionBadge="Why Transfer With Us"
      whySectionHeadline="A clearer way to move your domain"
      whyPoints={[
        {
          title: "See the price when you check", visual: "pricing",
          desc: "Enter your domain to see eligibility and the live transfer price. No guesswork before you start.",
        },
        {
          title: "We guide the unlock steps", visual: "clarity",
          desc: "Transfer lock and auth codes confuse many people. We explain both in plain language.",
        },
        {
          title: "Help if the move stalls", visual: "migration",
          desc: "If a transfer waits on an approval or registrar action, we help identify the current status and the party that must act next.",
        },
        {
          title: "Extension-specific renewal", visual: "ownership",
          desc: "Any registration extension follows the registry policy shown for the transfer; an extra year is not universal across extensions.",
        },
        {
          title: "Ready for hosting and email", visual: "integrate",
          desc: "After the move, point DNS to your hosting or set up business email without juggling another login.",
        },
        {
          title: "One team for what comes next", visual: "support",
          desc: "Keep domains, hosting, and growth work with one team instead of many separate vendors.",
        },
      ]}
      faqs={[
        {
          q: "How long does a domain transfer take?",
          a: "Timing varies by extension, registry, current registrar, lock status and required approval. The checker and transfer instructions provide the applicable expectation; some transfers may be faster or slower.",
        },
        {
          q: "What is an authorization or EPP code?",
          a: "It is a code from your current provider that proves you own the domain. You enter it at checkout so the transfer can be authorized.",
        },
        {
          q: "Do I need to unlock my domain first?",
          a: "Yes. Transfer lock must be turned off at your current provider before a transfer can start. We guide you through that step.",
        },
        {
          q: "Will my website go down during a transfer?",
          a: "Your site can stay online if DNS is set up correctly. We recommend checking DNS before and after the transfer window, and we can help if you need it.",
        },
        {
          q: "Does the transfer price include renewal?",
          a: "It depends on the extension and registry policy. Review the live transfer result and checkout terms to see whether the transfer extends the registration period.",
        },
        {
          q: "Can I transfer a .co.ke domain?",
          a: "We support many Kenyan and international extensions. Use the checker above to confirm if your domain can move and to see the live transfer price.",
        },
        {
          q: "What if I cannot find my authorization code?",
          a: "Ask your current provider for a transfer or EPP code. If you are unsure where to look, contact us and we will help you through it.",
        },
      ]}
      ctaHeadline="Ready to move your domain?"
      ctaSubtext="Check current eligibility and price, then review the extension-specific steps, timing and renewal treatment before you start."
    />
  );
}
