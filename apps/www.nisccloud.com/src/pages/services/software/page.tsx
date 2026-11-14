import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import ProjectEnquiryFlow from "@/components/ProjectEnquiryFlow.tsx";
import { SOFTWARE_OFFER } from "@/lib/project-packages.ts";
import { CodePipelineArt } from "@/components/artwork/build-art.tsx";
import { Code2, Smartphone, Users, Layers } from "lucide-react";

export default function SoftwarePage() {
  return (
    <ServicePageShell
      badge="Custom software"
      seoTitle="Custom software"
      headline={
        <>
          Software scoped before
          <br />
          <span className="text-primary">anyone starts building</span>
        </>
      }
      subtext="Web applications, mobile applications and internal tools. The proposal names the screens, integrations and handover. You pay 50% to start and 50% at launch."
      serviceType="marketing"
      plans={[]}
      customPlansSection={<ProjectEnquiryFlow offer={SOFTWARE_OFFER} />}
      heroIllustration={<CodePipelineArt />}
      trustStats={[
        { value: "50 / 50", label: "Deposit, then launch" },
        { value: "Scoped", label: "Before work starts" },
        { value: "One team", label: "Build and support" },
        { value: "2019", label: "Working this way since" },
      ]}
      features={[
        {
          icon: <Code2 size={20} />,
          title: "Web applications",
          desc: "Tools people use in a browser, from a customer portal to an internal workflow. The screens are agreed before build.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile applications",
          desc: "An app for the people who need it in their hand. Platform, accounts and stores are named in the proposal.",
        },
        {
          icon: <Users size={20} />,
          title: "The people who use it",
          desc: "Discovery starts with who signs in, what they need to finish, and what must stay out of scope.",
        },
        {
          icon: <Layers size={20} />,
          title: "Integrations you name",
          desc: "Payments, email, or the systems you already run are connected only when the proposal lists them. Hosting is quoted separately.",
        },
      ]}
      process={[
        { num: "01", title: "Discovery", desc: "We write down the users, the workflow and the systems involved before a price is set." },
        { num: "02", title: "Proposal", desc: "You approve the screens, integrations, price and schedule. Work starts after the 50% deposit." },
        { num: "03", title: "Build", desc: "We build the agreed scope and show it at the stages in the proposal." },
        { num: "04", title: "Handover", desc: "The remaining 50% is due at launch, with training for the people who will use it." },
      ]}
      whyPoints={[
        { title: "Scope before code", desc: "The proposal is the list of what gets built. Anything outside it is a separate agreement.", visual: "process" },
        { title: "One team after launch", desc: "The people who build it are the people you reach when something needs to change.", visual: "support" },
        { title: "Hosting on its own plan", desc: "Where the software runs is a hosting decision, priced and supported as a Nisc Cloud product.", visual: "pricing" },
      ]}
      whySectionVariant="simple"
      faqs={[
        { q: "How do I pay for custom software?", a: "The price is fixed in the proposal. You pay 50% to start and 50% at launch. There is no hourly billing." },
        { q: "Can this be a mobile app, a website, or an internal tool?", a: "Yes. The enquiry asks which of those you need. The proposal then names the platforms and the screens." },
        { q: "Who owns the software?", a: "Once the agreed invoices are paid, you own the approved deliverables listed in the proposal, subject to any third-party software or licence terms." },
        { q: "Is hosting included?", a: "No. Hosting is chosen and priced on its own, then managed in nPanel." },
      ]}
      ctaHeadline="Tell us what the software needs to do"
      ctaSubtext="Choose a package, share a budget range, and we reply with a proposal before any build starts."
    />
  );
}
