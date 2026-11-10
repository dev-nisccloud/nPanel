import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Globe, Terminal } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import {
  HostingHeroIllustration,
  vdsHeroConfig,
} from "../_components/HostingHeroIllustration.tsx";
import { VdsPlansSection } from "./_components/VdsPlansSection.tsx";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Production Oversight",
    headline: "Watch the services that depend on steadier sizing.",
    body: "Review core resource and service information for a production-sized environment, then connect the application monitoring and alerting your operating model requires.",
    bullets: [
      "Resource and service visibility",
      "Browser-based terminal access for authorised users",
      "A practical base for application monitoring",
    ],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "Reservation-Led Sizing",
    headline: "Size a VDS for sustained production demand",
    body: "Compare live VDS configurations, select an available image and provision an environment positioned for stronger resource reservation than entry VPS plans.",
    bullets: [
      "Current image choices shown during configuration",
      "Secure SSH and browser-terminal access",
      "Higher-performance configurations above VPS",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Production Fit",
    headline: "For services where resource consistency matters more.",
    body: "VDS is suited to production applications, databases and business systems whose measured demand justifies a stronger reservation profile than entry VPS.",
    bullets: [
      "WooCommerce and eCommerce stores",
      "Payment APIs and application backends",
      "SaaS platforms, CRMs, and custom business apps",
    ],
    mockupRight: true,
    visual: "resourceIsolation",
  },
];

export default function VdsHostingPage() {
  return (
    <ServicePageShell
      badge="VDS Servers"
      headline={<>Higher-Performance Virtual Compute. <span className="text-primary">Stronger Reservation.</span></>}
      subtext="Step up from entry VPS to production-oriented virtual compute with stronger reservation and larger sizing options. Exact CPU, memory, storage and network allocations are shown on each live plan."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vdsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "The tier above VPS", line2: "Managed through nPanel" }}
      trustStats={[
        { value: "Stronger", label: "Resource Reservation" },
        { value: "Root", label: "Authorised Access" },
        { value: "Live", label: "Plan Specifications" },
        { value: "nPanel", label: "Management" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "Stronger Resource Reservation",
          desc: "VDS is positioned above VPS with higher-performance configurations and stronger reservation, as specified by the selected plan.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Higher-Performance Compute",
          desc: "Select an available CPU and memory profile designed for more demanding production and data workloads.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Fast Storage Options",
          desc: "Available VDS plans use modern storage suited to databases, file services and application workloads.",
        },
        {
          icon: <Network size={20} />,
          title: "Plan Production Traffic",
          desc: "Match the selected plan's network allocation to expected traffic, integrations and data movement before deployment.",
        },
        {
          icon: <Shield size={20} />,
          title: "Security Options",
          desc: "Combine server controls, secure access and available network protections around your deployment requirements.",
        },
        {
          icon: <Zap size={20} />,
          title: "Configured Provisioning",
          desc: "Choose a supported operating system, add secure access details and prepare the environment for your stack.",
        },
        {
          icon: <Globe size={20} />,
          title: "Sized for Sustained Demand",
          desc: "Choose VDS when measured production usage calls for a stronger virtual resource profile than entry compute.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Administrative Access",
          desc: "Configure supported services using the authorised access included with the plan, subject to platform limits and the Acceptable Use Policy.",
        },
      ]}
      plansUnderHero={true}
      customPlansSection={<VdsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Measure the Requirement", desc: "Use application demand, database load and growth expectations to compare current VDS plan specifications." },
        { num: "02", title: "Choose the Reservation", desc: "Select a live configuration and available system image, then provide secure access details where supported." },
        { num: "03", title: "Move Into Production", desc: "Deploy the supported stack, monitoring and recovery procedures required by your service." },
        { num: "04", title: "Review Capacity", desc: "Track sustained demand and compare a larger VDS or dedicated allocation when the production profile changes." },
      ]}
      whyPoints={[
        { title: "A Step Above VPS", visual: "speed", desc: "Choose stronger resource reservation and higher-performance configurations for demanding workloads." },
        { title: "Production-Oriented Sizing", visual: "deploy", desc: "Choose a resource profile from measured demand rather than treating VDS as a generic VPS substitute." },
        { title: "A Clear Upgrade Path", visual: "growth", desc: "Move to a larger VDS or exclusive dedicated hardware as requirements grow." },
        { title: "Capacity for Core Services", visual: "integrate", desc: "Size customer-facing applications, databases and internal systems against the selected plan's stated allocations." },
        { title: "Control Within a Defined Service", visual: "ownership", desc: "Configure the environment using the access provided, subject to technical compatibility, plan limits and the Acceptable Use Policy." },
        { title: "Define Operational Ownership", visual: "support", desc: "Confirm whether your team or Nisc Cloud owns updates, security work and optimisation tasks before the service starts." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "Image availability changes by plan and platform. Review the current choices during configuration or ask Nisc Cloud to confirm a required distribution or custom-image need before purchase." },
        { q: "Can I run containers on my VDS?", a: "Container tooling may be used when it is compatible with the selected plan, system image and service policies. Production clusters should be designed around measured capacity and resilience requirements." },
        { q: "Is an uptime SLA available?", a: "Applicable availability commitments depend on the selected service and agreement. Confirm the current SLA terms with Nisc Cloud before purchase." },
        { q: "Is managed hosting available for VDS?", a: "Managed assistance may be added where available. Scope and response coverage are confirmed in the selected service agreement." },
        { q: "Can I scale my VDS up later?", a: "Available upgrade paths depend on the selected plan. Nisc Cloud can confirm the suitable VDS or dedicated tier for your next stage." },
        { q: "What network protection is included?", a: "Protection varies by plan and deployment. Confirm the included controls and any additional application-layer protection before purchase." },
      ]}
      pricingNote="Prices are shown in your selected currency, excluding 16% VAT. Custom configurations available for enterprise clients."
      ctaHeadline="Get a VDS That Performs as Hard as You Do"
      ctaSubtext="Move beyond VPS with higher-performance configurations and stronger reservation for demanding workloads."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
