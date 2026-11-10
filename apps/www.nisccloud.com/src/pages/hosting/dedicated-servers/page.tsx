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
    tag: "Physical Infrastructure Oversight",
    headline: "Operate an exclusive server with a defined ownership model.",
    body: "Review available server and service information, connect the observability stack your application requires, and assign hardware, system and application responsibilities.",
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
    tag: "When Physical Allocation Fits",
    headline: "Choose dedicated for hardware-specific requirements.",
    body: "Dedicated servers fit workloads that justify exclusive physical allocation, a particular hardware profile or an operational model that virtual tiers cannot satisfy.",
    bullets: [
      "High-traffic databases and data warehouses",
      "Latency-sensitive and high-throughput services",
      "Specialist compute where suitable hardware is available",
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
      subtext="Use an exclusively allocated physical server for hardware-specific, high-throughput or operationally demanding workloads. Processor, memory, storage, network and management options are confirmed for each configuration."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={dedicatedHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "Exclusive physical server", line2: "Configuration-led provisioning" }}
      trustStats={[
        { value: "1:1", label: "Physical Allocation" },
        { value: "Root", label: "Authorised Access" },
        { value: "Scoped", label: "Storage Options" },
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
        { num: "01", title: "Define the Requirement", desc: "Document compute, memory, storage, resilience, network, access and operating-system needs before choosing hardware." },
        { num: "02", title: "Hardware Provisioning", desc: "The selected server is configured and tested. Provisioning timing and access details are confirmed for the order." },
        { num: "03", title: "Accept and Deploy", desc: "Confirm the delivered configuration and authorised access, then deploy the supported database, application or specialist stack." },
        { num: "04", title: "Operate the Hardware", desc: "Monitor the metrics available for the service and plan capacity, maintenance and additional servers around measured demand." },
      ]}
      whyPoints={[
        { title: "Exclusive Physical Allocation", visual: "ownership", desc: "The server hardware is allocated exclusively to your service for the subscription term; this does not imply transfer of hardware ownership." },
        { title: "Configuration Before Commitment", visual: "code", desc: "Validate processor, memory, storage, network and access requirements against currently available hardware." },
        { title: "Storage Resilience Options", visual: "security", desc: "Select available storage and redundancy configurations based on workload and recovery requirements." },
        { title: "Planned Networking", visual: "integrate", desc: "Confirm throughput, addressing and protection requirements as part of the server configuration." },
        { title: "Evidence-Based Compliance", visual: "ethical", desc: "Any facility, security or compliance requirement is verified for the proposed deployment before it is included in an agreement." },
        { title: "Defined Operational Boundaries", visual: "support", desc: "Agree who handles hardware, operating-system and application tasks, and what assistance is available for the configuration." },
      ]}
      faqs={[
        { q: "How long does provisioning take?", a: "Provisioning depends on hardware availability and the selected configuration. Nisc Cloud confirms the expected window before the order is finalised." },
        { q: "Can I choose my operating system?", a: "Available operating systems and custom-image options are confirmed for the selected hardware before purchase." },
        { q: "Do I get out-of-band management access?", a: "Available remote-management options depend on the hardware and service model. The exact access level is confirmed in the proposal." },
        { q: "Is managed hosting available?", a: "Managed assistance may be added where available. Scope and response coverage are confirmed in the selected service agreement." },
        { q: "Can I run Kubernetes on a dedicated server?", a: "Dedicated infrastructure can support container platforms when the selected hardware and implementation are suitable. Architecture assistance is available on request." },
        { q: "What network protection is included?", a: "Protection varies by configuration and deployment. Confirm the included controls and any additional application-layer protection before purchase." },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Custom hardware configurations available on request."
      ctaHeadline="Get Dedicated Hardware That Never Compromises"
      ctaSubtext="Move beyond virtual tiers with exclusive physical server infrastructure configured for demanding workloads."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
