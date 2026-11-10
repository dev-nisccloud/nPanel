import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Globe, Terminal } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import {
  HostingHeroIllustration,
  vpsHeroConfig,
} from "../_components/HostingHeroIllustration.tsx";
import { VpsPlansSection } from "./_components/VpsPlansSection.tsx";
import { CloudServersStory } from "@/components/artwork/npanel-stories";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Day-to-Day Visibility",
    artwork: <CloudServersStory />,
    caption: false,
    headline: "See what your virtual server is doing.",
    body: "Review core resource and service information in your management workspace, then use your preferred monitoring stack for application-level observability.",
    bullets: [
      "Clear resource and service visibility",
      "Browser-based terminal access for authorised users",
      "A practical base for your own monitoring tools",
    ],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "Start with What You Need",
    headline: "Configure an entry virtual server around your workload",
    body: "Choose a currently available image and plan, add secure access details, and deploy a virtual environment without moving straight to a higher-reservation tier.",
    bullets: [
      "Current image choices shown during configuration",
      "Secure SSH and browser-terminal access",
      "Flexible environments for websites and applications",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Where VPS Fits",
    headline: "A flexible first step into virtual compute.",
    body: "VPS suits websites, development environments and application services that need root-level control and a defined resource plan without dedicated hardware.",
    bullets: [
      "WooCommerce and eCommerce stores",
      "Payment APIs and application backends",
      "SaaS platforms, CRMs, and custom business apps",
    ],
    mockupRight: true,
    visual: "workloads",
  },
];

export default function VpsHostingPage() {
  return (
    <ServicePageShell
      badge="VPS Servers"
      headline={<>Flexible Compute. <span className="text-primary">More Control.</span> VPS for Growing Workloads.</>}
      subtext="Choose flexible entry virtual compute for websites, applications and development environments that have outgrown standard web hosting."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vpsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "Virtual server flexibility", line2: "Managed through nPanel" }}
      trustStats={[
        { value: "Root", label: "Authorised Access" },
        { value: "Plan", label: "Defined Resources" },
        { value: "Flexible", label: "Virtual Compute" },
        { value: "nPanel", label: "Management" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "Flexible Virtual Resources",
          desc: "Choose a VPS plan with the compute, memory and storage profile that suits your current workload.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Configurable Compute",
          desc: "Select from available virtual CPU and memory configurations, then move to a larger plan as requirements grow.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Fast Storage Options",
          desc: "Available VPS plans use modern storage suited to websites, databases, file services and application workloads.",
        },
        {
          icon: <Network size={20} />,
          title: "Connectivity by Plan",
          desc: "Check the selected plan's network allocation before sizing a public website, API or private application service.",
        },
        {
          icon: <Shield size={20} />,
          title: "Security Options",
          desc: "Combine server-level controls, secure access and available network protections around your application requirements.",
        },
        {
          icon: <Zap size={20} />,
          title: "Straightforward Provisioning",
          desc: "Choose a supported operating system, add secure access details and prepare the environment for your stack.",
        },
        {
          icon: <Globe size={20} />,
          title: "A Base You Can Tune",
          desc: "Configure caching, application services and delivery choices around the needs and traffic profile of your site.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Administrative Access",
          desc: "Use the authorised access included with the selected service to configure supported software, subject to platform limits and the Acceptable Use Policy.",
        },
      ]}
      plansUnderHero={true}
      customPlansSection={<VpsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Choose a Starting Size", desc: "Compare live VPS plans, select an available system image and add your SSH public key where supported." },
        { num: "02", title: "Provision Securely", desc: "Provisioning details and authorised access information are provided for your configured server." },
        { num: "03", title: "Prepare the Workload", desc: "Connect through the authorised access method and configure a supported application stack within the service scope." },
        { num: "04", title: "Review as Usage Grows", desc: "Monitor demand and compare a larger VPS or higher-reservation VDS when the current size no longer fits." },
      ]}
      whyPoints={[
        { title: "More Control Than Web Hosting", visual: "code", desc: "Run a configurable virtual environment with root access and your own application stack." },
        { title: "Start Without Oversizing", visual: "deploy", desc: "Select a practical virtual footprint now, then reassess as traffic, data or background processing increases." },
        { title: "A Clear Upgrade Path", visual: "growth", desc: "Compare a larger VPS, a higher-reservation VDS tier or dedicated hardware as requirements grow." },
        { title: "Useful for Varied Projects", visual: "integrate", desc: "Host supported websites, internal tools, test environments and application backends on a suitably sized plan." },
        { title: "Control Within a Defined Service", visual: "ownership", desc: "Configure the environment using the access provided, subject to technical compatibility, plan limits and the Acceptable Use Policy." },
        { title: "Optional Management Scope", visual: "support", desc: "Ask which updates, security work and optimisation tasks can be included for the selected plan before ordering." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "Image availability changes by plan and platform. Review the current choices during configuration or ask Nisc Cloud to confirm a required distribution or custom-image need before purchase." },
        { q: "Can I run containers on my VPS?", a: "Container tooling may be used when it is compatible with the selected plan, system image and service policies. Cluster workloads should be sized and designed for their actual resource needs." },
        { q: "Is an uptime SLA available?", a: "Applicable availability commitments depend on the selected service and agreement. Confirm the current SLA terms with Nisc Cloud before purchase." },
        { q: "Is managed hosting available for VPS?", a: "Managed assistance may be added where available. Scope and response coverage are confirmed in the selected service agreement." },
        { q: "Can I scale my VPS up later?", a: "Available upgrade paths depend on the selected plan. Nisc Cloud can confirm the suitable VPS, VDS or dedicated tier for your next stage." },
        { q: "What network protection is included?", a: "Protection varies by plan and deployment. Confirm the included controls and any additional application-layer protection before purchase." },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Custom configurations available for enterprise clients."
      ctaHeadline="Get a VPS That Performs as Hard as You Do"
      ctaSubtext="Choose flexible virtual compute for websites, applications, development environments and growing workloads."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
