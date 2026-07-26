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
    headline: "Full visibility into your bare metal. 24/7.",
    body: "Monitor CPU, RAM, disk I/O, and network traffic in real time from your Grafana dashboard. Set custom alerts so you know about issues before your users do.",
    bullets: [
      "Real-time CPU, RAM, and disk usage monitoring",
      "Custom alert thresholds via email, SMS, and WhatsApp",
      "99.99% network uptime SLA with credits if we miss it",
    ],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "Instant Deployment",
    headline: "Your dedicated server ready in hours",
    body: "Choose your hardware configuration, OS, and options. Your bare metal server is provisioned and ready with full root access. No shared resources, ever.",
    bullets: [
      "Ubuntu, Debian, CentOS, AlmaLinux, Windows Server",
      "Full IPMI and out-of-band management access",
      "RAID configuration included, hardware-level redundancy",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Popular Use Cases",
    headline: "Maximum power for demanding workloads.",
    body: "Teams choose dedicated servers for high-throughput databases, large-scale SaaS platforms, game servers, and ML workloads that need full hardware ownership.",
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
      headline={<>Bare Metal Power. <span className="text-primary">Zero Compromise.</span> Dedicated Servers for Serious Workloads.</>}
      subtext="100% dedicated hardware with full root access, IPMI management, and enterprise-grade networking. Zero noisy neighbours, zero resource contention."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={dedicatedHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "Intel Xeon and AMD EPYC", line2: "100% bare metal hardware" }}
      trustStats={[
        { value: "100+", label: "Clients Served" },
        { value: "99.99%", label: "Network Uptime SLA" },
        { value: "24/7", label: "Support" },
        { value: "IPMI", label: "Out-of-band Access" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "100% Bare Metal Hardware",
          desc: "No virtualisation layer. No shared resources. Your server is physically yours: every core, every byte of RAM, every bit of bandwidth.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Latest Intel Xeon and AMD EPYC",
          desc: "Choose from Intel Xeon Silver/Gold or AMD EPYC processors. Up to 64 cores per server for compute-intensive workloads.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Enterprise NVMe and SAS Storage",
          desc: "RAID-10 NVMe SSDs or SAS drives with hardware RAID controllers. Up to 100+ TB raw storage available per server.",
        },
        {
          icon: <Network size={20} />,
          title: "10 Gbps Dedicated Port",
          desc: "Your own 10 Gbps port, not shared with other customers. Handle massive data transfers and high-concurrency applications with ease.",
        },
        {
          icon: <Shield size={20} />,
          title: "DDoS Protection Included",
          desc: "Enterprise-grade DDoS mitigation scrubs traffic at the network edge before it reaches your server. Up to 10 Gbps of attack traffic absorbed.",
        },
        {
          icon: <Zap size={20} />,
          title: "IPMI Out-of-band Access",
          desc: "Full IPMI/iDRAC/iLO access for power cycling, BIOS changes, and OS reloads without opening a support ticket.",
        },
        {
          icon: <Globe size={20} />,
          title: "Tier 3 Data Centres",
          desc: "Servers in Tier 3 certified facilities with N+1 power, cooling, and network redundancy. Compliant with ISO 27001 and SOC 2.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Full Root Access",
          desc: "Complete control from day one. Install any OS, run any software, and configure hardware settings directly from the IPMI console.",
        },
      ]}
      plansUnderHero={true}
      customPlansSection={<DedicatedPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Configure Your Server", desc: "Choose your CPU, RAM, storage, and OS. Select your RAID configuration and any extras you need." },
        { num: "02", title: "Hardware Provisioning", desc: "We rack, configure, and test your server. You receive IPMI access and root credentials by email." },
        { num: "03", title: "Deploy Your Stack", desc: "SSH in or use IPMI for full out-of-band access. Deploy Docker, Kubernetes, databases, or any custom workload." },
        { num: "04", title: "Monitor and Scale", desc: "Track hardware metrics, network utilisation, and uptime from your management portal. Add more servers as you grow." },
      ]}
      whyPoints={[
        { title: "100% Dedicated, Never Shared", desc: "Your hardware is yours alone. No CPU steal, no noisy neighbours, no virtualisation overhead." },
        { title: "IPMI Out-of-Band Management", desc: "Reboot, reinstall, or access the BIOS remotely at any time. Full hardware control without raising a support ticket." },
        { title: "Hardware RAID Redundancy", desc: "RAID-10 configuration included on all storage to protect against drive failure with no data loss." },
        { title: "Enterprise Networking", desc: "Redundant 10 Gbps uplinks, BGP routing, and Tier 1 carrier transit for strong throughput and availability." },
        { title: "Compliant Infrastructure", desc: "Tier 3 data centres with ISO 27001 and SOC 2 compliance. Suitable for fintech, healthcare, and government workloads." },
        { title: "Managed Support Available", desc: "Add our managed services option for OS maintenance, security patching, and 24/7 proactive monitoring by our team." },
      ]}
      faqs={[
        { q: "How long does provisioning take?", a: "Standard dedicated server configurations are provisioned within 2 to 24 hours. Custom configurations may take up to 48 hours depending on hardware availability." },
        { q: "Can I choose my operating system?", a: "Yes. We support Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux, and Windows Server. Custom ISO uploads are available on all dedicated plans." },
        { q: "Do I get IPMI access?", a: "Yes. Every dedicated server includes full IPMI/iDRAC/iLO access for remote power management, BIOS configuration, and OS reloads." },
        { q: "Is managed hosting available?", a: "Yes. Our managed dedicated server add-on includes OS updates, security hardening, 24/7 proactive monitoring, and monthly performance reviews." },
        { q: "Can I run Kubernetes on a dedicated server?", a: "Yes. Bare metal Kubernetes delivers significantly better performance than virtualised environments. We can pre-configure K8s clusters on request." },
        { q: "What DDoS protection is included?", a: "All dedicated servers include volumetric DDoS mitigation at the network level at no extra cost. Premium Layer 7 protection is available as an add-on." },
      ]}
      pricingNote="All prices in KES. Annual billing saves 15%. Custom hardware configurations available on request."
      ctaHeadline="Get Dedicated Hardware That Never Compromises"
      ctaSubtext="Stop sharing resources. Get enterprise-grade dedicated servers with 100% hardware ownership, 99.99% uptime focus, and 24/7 support."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
