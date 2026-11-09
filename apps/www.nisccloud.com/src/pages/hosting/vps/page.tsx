import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Globe, Terminal } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import {
  HostingHeroIllustration,
  vpsHeroConfig,
} from "../_components/HostingHeroIllustration.tsx";
import { VpsPlansSection } from "./_components/VpsPlansSection.tsx";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Server Monitoring",
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
    tag: "Straightforward Deployment",
    headline: "Configure a VPS around your workload",
    body: "Choose an available operating system and plan, add secure access details, and deploy a virtual environment for your application.",
    bullets: [
      "A choice of supported operating systems",
      "Secure SSH and browser-terminal access",
      "Flexible environments for websites and applications",
    ],
    mockupRight: false,
    visual: "serverProvision",
  },
  {
    tag: "Popular Use Cases",
    headline: "Any workload. One powerful platform.",
    body: "Teams use VPS environments for stores, APIs, business applications and development workloads that need more control than shared hosting.",
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
      subtext="Configure a virtual server with guaranteed CPU and RAM and NVMe storage for websites, applications, development environments and workloads that have outgrown shared hosting."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vpsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      heroTrustBadge={{ line1: "Virtual server flexibility", line2: "Managed through nPanel" }}
      trustStats={[
        { value: "Root", label: "Authorised Access" },
        { value: "NVMe", label: "Storage" },
        { value: "Guaranteed", label: "CPU and RAM" },
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
          title: "Connected for Real Workloads",
          desc: "Run public websites, APIs and private application services with the connectivity included in your selected plan.",
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
      customPlansSection={<VpsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Configure Your VPS", desc: "Choose your plan, operating system (Ubuntu, CentOS, Debian, AlmaLinux), and add your SSH public key for secure access." },
        { num: "02", title: "Provision Securely", desc: "Provisioning details and authorised access information are provided for your configured server." },
        { num: "03", title: "Deploy Your Stack", desc: "Connect through SSH or the authorised browser terminal and deploy the software your workload requires." },
        { num: "04", title: "Monitor and Scale", desc: "Review the environment and move to a larger configuration when your requirements increase." },
      ]}
      whyPoints={[
        { title: "More Control Than Shared Hosting", visual: "code", desc: "Run a configurable virtual environment with root access and your own application stack." },
        { title: "Practical Deployment", visual: "deploy", desc: "Choose your OS, add your key and prepare the server around your workload." },
        { title: "A Clear Upgrade Path", visual: "growth", desc: "Move to a larger VPS, a higher-reservation VDS tier or dedicated hardware as requirements grow." },
        { title: "Built for Connected Applications", visual: "integrate", desc: "Host public services, internal tools and application backends on a plan selected for your traffic needs." },
        { title: "Full Control, No Restrictions", visual: "ownership", desc: "Run Docker, Kubernetes, custom firewall rules, VPN servers, game servers, or any workload. Root access means total freedom." },
        { title: "Managed Support Available", visual: "support", desc: "Don't want to manage your server yourself? Add our managed services option and our team handles updates, security patches, and optimisation." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "We offer Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8/9, AlmaLinux 8/9, and Rocky Linux 8/9. Custom ISO uploads are available on Enterprise plans." },
        { q: "Can I run Docker or Kubernetes on my VPS?", a: "Yes. You have full root access and can install and run Docker, Docker Compose, or Kubernetes clusters without restrictions from our side." },
        { q: "Is an uptime SLA available?", a: "Applicable availability commitments depend on the selected service and agreement. Confirm the current SLA terms with Nisc Cloud before purchase." },
        { q: "Is managed hosting available for VPS?", a: "Managed assistance may be added where available. Scope and response coverage are confirmed in the selected service agreement." },
        { q: "Can I scale my VPS up later?", a: "Available upgrade paths depend on the selected plan. Nisc Cloud can confirm the suitable VPS, VDS or dedicated tier for your next stage." },
        { q: "What network protection is included?", a: "Protection varies by plan and deployment. Confirm the included controls and any additional application-layer protection before purchase." },
      ]}
      pricingNote="All prices in KES, excluding 16% VAT. Custom configurations available for enterprise clients."
      ctaHeadline="Get a VPS That Performs as Hard as You Do"
      ctaSubtext="Choose flexible virtual compute for websites, applications, development environments and growing workloads."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
