import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Globe, Terminal } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import {
  HostingHeroIllustration,
  dedicatedHeroConfig,
} from "../_components/HostingHeroIllustration.tsx";
import { DedicatedPlansSection } from "./_components/DedicatedPlansSection.tsx";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Server Monitoring",
    headline: "Visibility for demanding infrastructure.",
    body: "Review core server and service information in your management workspace, then connect the observability stack your application requires.",
    bullets: [
      "Server and service visibility",
      "Secure administrative access",
      "A practical base for infrastructure monitoring",
    ],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "Hardware Provisioning",
    headline: "A physical server configured for your workload",
    body: "Select an available hardware configuration, operating system and management options. Provisioning timing is confirmed for the chosen configuration.",
    bullets: [
      "A choice of supported operating systems",
      "Administrative access options",
      "Storage and resilience options by configuration",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Popular Use Cases",
    headline: "Maximum power for demanding workloads.",
    body: "Teams choose dedicated servers for high-throughput databases, large-scale applications and specialist workloads that benefit from exclusive physical infrastructure.",
    bullets: [
      "High-traffic databases and data warehouses",
      "Game servers and real-time streaming platforms",
      "Machine learning and GPU compute workloads",
    ],
    mockupRight: true,
    visual: "bareMetal",
  },
];

export default function DedicatedServersHostingPage() {
  return (
    <ServicePageShell
      badge="Dedicated Servers"
      headline={<>Exclusive Physical Infrastructure. <span className="text-primary">Greater Hardware Control.</span></>}
      subtext="Dedicated servers give you exclusive use of physical hardware, with guaranteed CPU and RAM that is never shared and NVMe storage, for demanding workloads, custom environments and infrastructure that has moved beyond virtual tiers."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={dedicatedHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "Exclusive physical server", line2: "Configuration-led provisioning" }}
      trustStats={[
        { value: "1:1", label: "Physical Allocation" },
        { value: "Root", label: "Authorised Access" },
        { value: "NVMe", label: "Storage" },
        { value: "nPanel", label: "Service Management" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "Exclusive Physical Server",
          desc: "Use a physical server allocated exclusively to your service, without sharing its compute and memory with another virtual tenant.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Configuration Options",
          desc: "Choose from available processor, memory and storage profiles based on the needs of your workload.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Storage Options",
          desc: "Select from available storage and resilience configurations for databases, applications and data-intensive services.",
        },
        {
          icon: <Network size={20} />,
          title: "Network Configuration",
          desc: "Match connectivity options to application traffic, data transfer and availability requirements.",
        },
        {
          icon: <Shield size={20} />,
          title: "Security Options",
          desc: "Combine server hardening, secure administrative access and available network protections around your deployment.",
        },
        {
          icon: <Zap size={20} />,
          title: "Hardware Management",
          desc: "Available management options are confirmed for the selected server configuration and access model.",
        },
        {
          icon: <Globe size={20} />,
          title: "Planned Infrastructure",
          desc: "Select a configuration around verified compute, storage, networking and operational requirements.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Administrative Control",
          desc: "Run your approved operating system and application stack with the authorised access defined for your service.",
        },
      ]}
      plansUnderHero={true}
      customPlansSection={<DedicatedPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Configure Your Server", desc: "Choose your CPU, RAM, storage, and OS. Select your RAID configuration and any extras you need." },
        { num: "02", title: "Hardware Provisioning", desc: "The selected server is configured and tested. Provisioning timing and access details are confirmed for the order." },
        { num: "03", title: "Deploy Your Stack", desc: "Use the authorised administrative access to deploy databases, applications or other supported workloads." },
        { num: "04", title: "Monitor and Scale", desc: "Track hardware metrics, network utilisation, and uptime from your management portal. Add more servers as you grow." },
      ]}
      whyPoints={[
        { title: "Exclusive Physical Allocation", visual: "ownership", desc: "The server hardware is allocated exclusively to your service for the subscription term; this does not imply transfer of hardware ownership." },
        { title: "Greater Hardware Control", visual: "code", desc: "Choose available management and access options around the configuration you select." },
        { title: "Storage Resilience Options", visual: "security", desc: "Select available storage and redundancy configurations based on workload and recovery requirements." },
        { title: "Planned Networking", visual: "integrate", desc: "Confirm throughput, addressing and protection requirements as part of the server configuration." },
        { title: "Evidence-Based Compliance", visual: "ethical", desc: "Any facility, security or compliance requirement is verified for the proposed deployment before it is included in an agreement." },
        { title: "Managed Assistance Available", visual: "support", desc: "Ask Nisc Cloud to define the available maintenance and operational scope for your configuration." },
      ]}
      faqs={[
        { q: "How long does provisioning take?", a: "Provisioning depends on hardware availability and the selected configuration. Nisc Cloud confirms the expected window before the order is finalised." },
        { q: "Can I choose my operating system?", a: "Available operating systems and custom-image options are confirmed for the selected hardware before purchase." },
        { q: "Do I get out-of-band management access?", a: "Available remote-management options depend on the hardware and service model. The exact access level is confirmed in the proposal." },
        { q: "Is managed hosting available?", a: "Managed assistance may be added where available. Scope and response coverage are confirmed in the selected service agreement." },
        { q: "Can I run Kubernetes on a dedicated server?", a: "Dedicated infrastructure can support container platforms when the selected hardware and implementation are suitable. Architecture assistance is available on request." },
        { q: "What network protection is included?", a: "Protection varies by configuration and deployment. Confirm the included controls and any additional application-layer protection before purchase." },
      ]}
      pricingNote="Prices are shown in your selected currency, excluding 16% VAT. Custom hardware configurations available on request."
      ctaHeadline="Get Dedicated Hardware That Never Compromises"
      ctaSubtext="Move beyond virtual tiers with exclusive physical server infrastructure configured for demanding workloads."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
