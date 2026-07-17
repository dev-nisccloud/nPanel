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
          Move Your Domain Here.{" "}
          <span className="text-primary">We Help You Through It.</span>
        </>
      }
      subtext="Bring your domain to one place with your hosting and email. Check if it can move, see the live transfer price, then finish checkout with your authorization code. Free setup help and 24/7 support if you get stuck."
      serviceType="hosting"
      plans={[]}
      plansUnderHero
      customPlansSection={<TransferToolSection />}
      heroImage={niscWebsiteImage("domain transfer.png")}
      heroImageStandalone
      heroCta2="Check Your Domain"
      heroTrustBadge={{ line1: "Free transfer help", line2: "1 year renewal included" }}
      trustStats={[
        { value: "5-7", label: "Days Typical Transfer" },
        { value: "200+", label: "Extensions Supported" },
        { value: "24/7", label: "Support Ready" },
        { value: "Free", label: "Setup Help" },
      ]}
      features={[
        {
          icon: <ArrowLeftRight size={20} />,
          title: "A Clear Transfer Path",
          desc: "Check your domain, see if it can move, then follow a few simple steps. No confusing registrar jargon.",
        },
        {
          icon: <Key size={20} />,
          title: "Auth Code Made Simple",
          desc: "We explain what an authorization code is, where to find it at your current provider, and when to enter it.",
        },
        {
          icon: <Shield size={20} />,
          title: "Safe Every Step of the Way",
          desc: "Your domain stays protected during the move with lock checks and verification before the transfer starts.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Renewal Included",
          desc: "A successful transfer adds one year to your registration, so your expiry date moves forward with the move.",
        },
        {
          icon: <Globe size={20} />,
          title: "Local and Global Names",
          desc: "Move .co.ke, .com, .org, and many other endings into one account you can manage in one place.",
        },
        {
          icon: <Headphones size={20} />,
          title: "Real Help When You Need It",
          desc: "24/7 support for unlock steps, auth codes, and status updates if your current registrar is slow.",
        },
        {
          icon: <Clock size={20} />,
          title: "Know What Happens Next",
          desc: "We keep the process clear from check to completion so you always know the next step.",
        },
        {
          icon: <CheckCircle2 size={20} />,
          title: "One Place After the Move",
          desc: "When the transfer finishes, manage DNS, renewals, hosting, and email from the same panel.",
        },
      ]}
      process={[
        {
          num: "01",
          title: "Check Your Domain",
          desc: "Enter your domain above. We confirm if it can transfer and show the live transfer price before you pay.",
        },
        {
          num: "02",
          title: "Unlock and Get Your Code",
          desc: "Turn off transfer lock at your current provider and request your authorization (EPP) code.",
        },
        {
          num: "03",
          title: "Pay and Start the Move",
          desc: "Add the transfer to cart, enter your auth code, and complete easy checkout. We submit the request for you.",
        },
        {
          num: "04",
          title: "Approve and Finish",
          desc: "Confirm the transfer email from your current registrar if they send one. When done, manage the domain here.",
        },
      ]}
      whySectionBadge="Why Transfer With Us"
      whySectionHeadline="A Clearer Way to Move Your Domain"
      whyPoints={[
        {
          title: "See the Price When You Check",
          desc: "Enter your domain to see eligibility and the live transfer price. No guesswork before you start.",
        },
        {
          title: "We Guide the Unlock Steps",
          desc: "Transfer lock and auth codes confuse many people. We explain both in plain language.",
        },
        {
          title: "Help If the Move Stalls",
          desc: "If a transfer sits waiting, our team helps you chase updates so you are not left guessing.",
        },
        {
          title: "One Extra Year Included",
          desc: "When the transfer succeeds, you get one year of registration added to the domain.",
        },
        {
          title: "Ready for Hosting and Email",
          desc: "After the move, point DNS to your hosting or set up business email without juggling another login.",
        },
        {
          title: "One Team for What Comes Next",
          desc: "Keep domains, hosting, and growth work with one team instead of many separate vendors.",
        },
      ]}
      faqs={[
        {
          q: "How long does a domain transfer take?",
          a: "Most transfers finish in about 5 to 7 days. The exact time depends on your current registrar and how quickly you approve any confirmation emails.",
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
          a: "Yes. The transfer price includes one extra year of registration added when the transfer completes successfully.",
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
      ctaHeadline="Ready to Move Your Domain?"
      ctaSubtext="Check eligibility in seconds. If you need help unlocking your domain or finding your authorization code, our team is here 24/7."
    />
  );
}
