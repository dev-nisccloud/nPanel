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
    headline: "Full visibility into your server. 24/7.",
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
    headline: "Your VDS ready in under 5 minutes",
    body: "Choose your OS, add your SSH key, and click deploy. No waiting, no provisioning delays. Your AMD EPYC-powered server is live and accessible in minutes.",
    bullets: [
      "Ubuntu, Debian, CentOS, AlmaLinux, your choice",
      "SSH access available within 5 minutes of payment",
      "One-click LAMP, LEMP, Docker, and Node.js stacks",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Popular Use Cases",
    headline: "Any workload. One powerful platform.",
    body: "Teams use our VDS for stores, APIs, SaaS apps, and staging environments. Dedicated resources mean your app performs consistently.",
    bullets: [
      "WooCommerce and eCommerce stores with full resource isolation",
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
      headline={<>Dedicated Power. <span className="text-primary">Full Isolation.</span> VDS Built for Serious Workloads.</>}
      subtext="Full root access, guaranteed isolated resources, and fast provisioning. Deploy your custom stack in minutes with no shared resources and no compromises."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vdsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "AMD EPYC Processors", line2: "Deployed in under 5 minutes" }}
      trustStats={[
        { value: "100+", label: "Clients Served" },
        { value: "99.99%", label: "Network Uptime SLA" },
        { value: "24/7", label: "Support" },
        { value: "<5 min", label: "Average Deployment Time" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "Guaranteed Dedicated Resources",
          desc: "Unlike shared hosting, your CPU cores, RAM, and SSD are yours alone. No noisy neighbours, no resource contention, consistent performance at all times.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Latest-Gen AMD EPYC CPUs",
          desc: "Powered by AMD EPYC processors, the same architecture used by major cloud providers. Your workloads get strong compute performance.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "NVMe SSD RAID Storage",
          desc: "Enterprise NVMe SSD in RAID-10 configuration delivers 3,500 MB/s read speeds. Databases, file servers, and apps run at full speed.",
        },
        {
          icon: <Network size={20} />,
          title: "10 Gbps Network Port",
          desc: "Each VDS is connected to a 10 Gbps uplink. Handle high traffic, large file transfers, and media streaming without bandwidth bottlenecks.",
        },
        {
          icon: <Shield size={20} />,
          title: "DDoS Protection Included",
          desc: "Industry-grade DDoS mitigation is included on all VDS plans. Volumetric attacks are scrubbed at the network edge before reaching your server.",
        },
        {
          icon: <Zap size={20} />,
          title: "Instant Provisioning",
          desc: "Your VDS is deployed and ready in under 5 minutes. Choose your OS, add your SSH key, and start deploying your applications immediately.",
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
        { num: "02", title: "Instant Deployment", desc: "Your VDS is provisioned in under 5 minutes. You will receive your IP address, root credentials, and connection guide by email." },
        { num: "03", title: "Deploy Your Stack", desc: "SSH in and deploy your applications. Use our one-click app scripts for LAMP, LEMP, Docker, Node.js, or any custom stack you need." },
        { num: "04", title: "Monitor and Scale", desc: "Use our monitoring dashboard to track CPU, RAM, disk, and network usage. Scale up resources with one click when your business demands it." },
      ]}
      whyPoints={[
        { title: "Guaranteed Resources, Not Shared", desc: "Every vCPU and GB of RAM is dedicated to your VDS alone. You always get the performance you are paying for." },
        { title: "Deploy in Minutes", desc: "Choose your OS, add your key, and go live quickly. Setup help is available if you need a hand." },
        { title: "Upgrade Without Long Downtime", desc: "Need more RAM or CPU? We upgrade your VDS resources live in most cases. No migration, no rebuild for your users." },
        { title: "Enterprise Networking Infrastructure", desc: "Redundant 10 Gbps uplinks, BGP routing, and carrier-grade switches help keep your server reachable." },
        { title: "Full Control, No Restrictions", desc: "Run Docker, Kubernetes, custom firewall rules, VPN servers, game servers, or any workload. Root access means total freedom." },
        { title: "Managed Support Available", desc: "Don't want to manage your server yourself? Add our managed services option and our team handles updates, security patches, and optimisation." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "We offer Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8/9, AlmaLinux 8/9, and Rocky Linux 8/9. Custom ISO uploads are available on Enterprise plans." },
        { q: "Can I run Docker or Kubernetes on my VDS?", a: "Yes. You have full root access and can install and run Docker, Docker Compose, or Kubernetes clusters without restrictions from our side." },
        { q: "How does the 99.99% uptime SLA work?", a: "We guarantee 99.99% monthly network uptime. If we fail to meet this SLA, you receive service credits equal to 10x the downtime value. We publish real-time status at status.nisccloud.co.ke." },
        { q: "Is managed hosting available for VDS?", a: "Yes. Our managed VDS add-on includes OS updates, security hardening, 24/7 proactive monitoring, incident response, and monthly performance reports." },
        { q: "Can I scale my VDS up later?", a: "Yes. You can upgrade CPU, RAM, and storage at any time from your dashboard. Upgrades are applied within 15 minutes and typically require only a brief reboot." },
        { q: "Do you provide DDoS protection?", a: "All VDS plans include volumetric DDoS mitigation at the network level at no extra cost. We can absorb attacks up to 10 Gbps. For advanced Layer 7 protection, ask about our premium DDoS service." },
      ]}
      pricingNote="All prices in KES. Annual billing saves 15%. Custom configurations available for enterprise clients."
      ctaHeadline="Get a VDS That Performs as Hard as You Do"
      ctaSubtext="Stop overpaying for sluggish shared hosting. Get isolated resources, fast deployment, 99.99% uptime focus, and 24/7 support."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
