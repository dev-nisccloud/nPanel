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
    tag: "Server Monitoring",
    headline: "A clearer view of higher-performance workloads.",
    body: "Review core resource and service information in your management workspace, then connect the monitoring stack your application requires.",
    bullets: [
      "Resource and service visibility",
      "Browser-based terminal access for authorised users",
      "A practical base for application monitoring",
    ],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "Configured Deployment",
    headline: "Build a VDS around demanding workloads",
    body: "Select an available VDS configuration and operating system, add secure access details, and provision an environment with stronger resource reservation than VPS.",
    bullets: [
      "A choice of supported operating systems",
      "Secure SSH and browser-terminal access",
      "Higher-performance configurations above VPS",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Popular Use Cases",
    headline: "Any workload. One powerful platform.",
    body: "Teams use VDS environments for stores, APIs, business applications and production workloads that need stronger reservation than standard VPS.",
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
      subtext="Step up from VPS to higher-resource VDS configurations with guaranteed, reserved CPU and RAM and NVMe storage for demanding applications, production services and growing workloads."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vdsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "The tier above VPS", line2: "Managed through nPanel" }}
      trustStats={[
        { value: "Guaranteed", label: "Reserved CPU and RAM" },
        { value: "Root", label: "Authorised Access" },
        { value: "NVMe", label: "Storage" },
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
          title: "Connected for Production",
          desc: "Run public services, application backends and private systems with the connectivity included in your selected plan.",
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
          title: "Fast for Your Visitors",
          desc: "Built for responsive apps and sites. Your users get a fast experience wherever they are.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Full Root Access",
          desc: "Complete control over your server environment. Install any software, configure custom kernel parameters, and run Docker containers without restrictions.",
        },
      ]}
      plansUnderHero={true}
      customPlansSection={<VdsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Configure Your VDS", desc: "Choose your plan, operating system (Ubuntu, CentOS, Debian, AlmaLinux), and add your SSH public key for secure access." },
        { num: "02", title: "Provision Securely", desc: "Provisioning details and authorised access information are provided for your configured server." },
        { num: "03", title: "Deploy Your Stack", desc: "Connect through SSH or the authorised browser terminal and deploy the software your workload requires." },
        { num: "04", title: "Monitor and Scale", desc: "Review the environment and move to a larger VDS or dedicated server when requirements increase." },
      ]}
      whyPoints={[
        { title: "A Step Above VPS", visual: "speed", desc: "Choose stronger resource reservation and higher-performance configurations for demanding workloads." },
        { title: "Practical Deployment", visual: "deploy", desc: "Choose your OS, add your key and prepare the server around your workload." },
        { title: "A Clear Upgrade Path", visual: "growth", desc: "Move to a larger VDS or exclusive dedicated hardware as requirements grow." },
        { title: "Built for Connected Applications", visual: "integrate", desc: "Host public services, internal tools and application backends on a plan selected for your traffic needs." },
        { title: "Full Control, No Restrictions", visual: "ownership", desc: "Run Docker, Kubernetes, custom firewall rules, VPN servers, game servers, or any workload. Root access means total freedom." },
        { title: "Managed Support Available", visual: "support", desc: "Don't want to manage your server yourself? Add our managed services option and our team handles updates, security patches, and optimisation." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "We offer Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8/9, AlmaLinux 8/9, and Rocky Linux 8/9. Custom ISO uploads are available on Enterprise plans." },
        { q: "Can I run Docker or Kubernetes on my VDS?", a: "Yes. You have full root access and can install and run Docker, Docker Compose, or Kubernetes clusters without restrictions from our side." },
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
