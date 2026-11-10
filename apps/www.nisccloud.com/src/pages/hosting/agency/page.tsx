import { AgencyPlans } from "./_components/AgencyPlans.tsx";
import ServicePageShell from "@/pages/_components/ServicePageShell";
import { GoalArtwork } from "@/pages/_components/GoalArtwork";
import { NpanelAgencyArt, NpanelOperationsArt } from "@/components/artwork/npanel-art.tsx";
export default function AgencyHostingPage() {
  return (
    <ServicePageShell
      badge="Agency Hosting · New"
      headline="Agency hosting for the websites your clients depend on"
      subtext="Bring your client hosting requirements into one conversation. Nisc Cloud helps agencies in Kenya plan website hosting, domains, business email and infrastructure around the portfolios they manage."
      serviceType="hosting"
      plans={[]}
      plansUnderHero
      customPlansSection={<AgencyPlans />}
      heroIllustration={<NpanelAgencyArt />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroCta2="Compare cloud products"
      heroCta2Href="/hosting"
      showcaseBlocks={[
        {
          tag: "Hosting for agencies",
          headline: "Keep client work moving after launch.",
          body: "Launching a website is only the beginning. Renewals, resource needs and technical support continue throughout the client relationship. Agency hosting gives you a way to plan these responsibilities across your portfolio, with a hosting arrangement matched to the websites you manage.",
          bullets: [
            "Start with a portfolio and workload review",
            "Agree who manages updates, content and support",
            "Define the migration sequence before changing DNS",
          ],
          visual: "speed",
          artwork: <NpanelOperationsArt />,
        },
        {
          tag: "Choose the right setup",
          headline: "Agency hosting or managed WordPress hosting?",
          body: "Choose agency hosting when your main requirement is managing several client websites with different needs. Managed WordPress hosting focuses on the WordPress platform. Your agency portfolio may include WordPress, online stores and custom applications; the appropriate infrastructure depends on those workloads.",
          bullets: [
            "Discuss client access and ownership",
            "Confirm backup retention and restoration scope",
            "Review renewal pricing and upgrade options",
          ],
          visual: "wpStaging",
          artwork: <GoalArtwork kind="build" />,
          visualRight: true,
        },
      ]}
      faqs={[
        {
          q: "What is agency hosting?",
          a: "Agency hosting is a hosting arrangement for designers, developers and agencies that manage client websites. The important differences are portfolio requirements, access arrangements, support responsibilities and capacity planning.",
        },
        {
          q: "Are agency hosting and reseller hosting the same?",
          a: "Not necessarily. Reseller hosting usually includes the ability to sell hosting accounts under an agreed reseller arrangement. Ask us about your billing, branding and client-access requirements so the proposal clearly states what is included.",
        },
        {
          q: "How much does agency hosting cost in Kenya?",
          a: "Pricing depends on the number and type of websites, storage, traffic, management requirements and support scope. Request a proposal with your portfolio details for an itemised quote in KES.",
        },
        {
          q: "Can you help move existing client websites?",
          a: "Share the current platforms, hosting access and site sizes. We will assess migration requirements, agree the scope and plan the move before any live DNS changes.",
        },
      ]}
      ctaHeadline="Plan the next stage of your agency hosting"
      ctaSubtext="Share your website portfolio, current challenges and expected growth. We will help you choose an appropriate setup."
    />
  );
}
