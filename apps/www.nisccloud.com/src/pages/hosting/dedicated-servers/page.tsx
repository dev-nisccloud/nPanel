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
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[oklch(0.18_0.015_260)] px-5 py-2.5 text-white text-sm font-bold flex items-center justify-between">
            <span>Dedicated Monitor</span>
            <span className="text-green-400 text-xs font-semibold">● Online</span>
          </div>
          <div className="p-4 space-y-3">
            {[["CPU Usage","12%","oklch(0.60 0.22 235)"],["RAM Usage","28%","oklch(0.55 0.18 195)"],["Disk I/O","8%","oklch(0.65 0.16 160)"],["Network","8 Gbps","oklch(0.58 0.22 300)"]].map(([label, value, color]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold" style={{ color: String(color) }}>{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: typeof value === "string" && value.includes("%") ? value : "80%", background: String(color) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Instant Deployment",
    headline: "Your dedicated server ready in hours",
    body: "Choose your hardware configuration, OS, and data centre. Your bare metal server is provisioned and ready with full root access. No shared resources, ever.",
    bullets: [
      "Ubuntu, Debian, CentOS, AlmaLinux, Windows Server",
      "Full IPMI & out-of-band management access",
      "RAID configuration included, hardware-level redundancy",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-[oklch(0.12_0.015_260)] rounded-2xl border border-border/40 shadow-md overflow-hidden font-mono text-xs">
          <div className="px-4 py-2.5 bg-[oklch(0.18_0.015_260)] flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-white/50 ml-2">terminal</span>
          </div>
          <div className="p-4 space-y-1.5 text-green-400">
            <div>$ ssh root@196.201.xxx.xxx</div>
            <div className="text-white/60">Welcome to Ubuntu 24.04 LTS</div>
            <div className="text-white/60">Intel Xeon 32C | 256GB RAM | RAID-10</div>
            <div>$ <span className="text-white">docker swarm init</span></div>
            <div className="text-white/60">Swarm initialized: manager node</div>
            <div>$ <span className="animate-pulse">_</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">100%</div>
            <div className="text-[10px] text-muted-foreground">Dedicated hardware</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">IPMI</div>
            <div className="text-[10px] text-muted-foreground">Out-of-band access</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Popular Use Cases",
    headline: "Maximum power for demanding workloads.",
    body: "Enterprises choose dedicated servers for high-throughput databases, large-scale SaaS platforms, game servers, and ML workloads that require full hardware ownership.",
    bullets: [
      "High-traffic databases and data warehouses",
      "Game servers and real-time streaming platforms",
      "Machine learning and GPU compute workloads",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-2.5">
        {[
          { icon: "🗄️", label: "Database Cluster", desc: "MySQL, PostgreSQL, MongoDB at scale" },
          { icon: "🎮", label: "Game Server", desc: "Low latency, full hardware control" },
          { icon: "🧠", label: "ML / AI Workloads", desc: "GPU compute, large model inference" },
          { icon: "📦", label: "Kubernetes Cluster", desc: "Full bare-metal K8s deployment" },
          { icon: "💰", label: "Fintech Backend", desc: "Isolated, compliant infrastructure" },
          { icon: "📡", label: "CDN Edge Node", desc: "10 Gbps throughput, Tier 3 DC" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex items-center gap-3 bg-white dark:bg-card rounded-xl border border-border/40 shadow-sm p-2.5 text-xs">
            <span className="text-lg">{icon}</span>
            <div>
              <div className="font-semibold">{label}</div>
              <div className="text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
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
      heroTrustBadge={{ line1: "Intel Xeon & AMD EPYC", line2: "100% bare metal hardware" }}
      trustStats={[
        { value: "100%", label: "Dedicated Hardware" },
        { value: "99.99%", label: "Network Uptime SLA" },
        { value: "10 Gbps", label: "Network Bandwidth" },
        { value: "IPMI", label: "Out-of-band Access" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "100% Bare Metal Hardware",
          desc: "No virtualisation layer. No shared resources. Your server is physically yours  every core, every byte of RAM, every bit of bandwidth.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Latest Intel Xeon & AMD EPYC",
          desc: "Choose from Intel Xeon Silver/Gold or AMD EPYC processors. Up to 64 cores per server for compute-intensive workloads.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Enterprise NVMe & SAS Storage",
          desc: "RAID-10 NVMe SSDs or SAS drives with hardware RAID controllers. Up to 100+ TB raw storage available per server.",
        },
        {
          icon: <Network size={20} />,
          title: "10 Gbps Dedicated Port",
          desc: "Your own 10 Gbps port  not shared with other customers. Handle massive data transfers and high-concurrency applications with ease.",
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
        { num: "01", title: "Configure Your Server", desc: "Choose your CPU, RAM, storage, and OS. Select your preferred data centre location and RAID configuration." },
        { num: "02", title: "Hardware Provisioning", desc: "We physically rack, configure, and test your server. You receive IPMI access and root credentials by email." },
        { num: "03", title: "Deploy Your Stack", desc: "SSH in or use IPMI for full out-of-band access. Deploy Docker, Kubernetes, databases, or any custom workload." },
        { num: "04", title: "Monitor and Scale", desc: "Track hardware metrics, network utilisation, and uptime from your management portal. Add more servers as you grow." },
      ]}
      whyPoints={[
        { title: "100% Dedicated  Never Shared", desc: "Your hardware is yours alone. No CPU steal, no noisy neighbours, no virtualisation overhead." },
        { title: "IPMI Out-of-Band Management", desc: "Reboot, reinstall, or access the BIOS remotely at any time. Full hardware control without raising a support ticket." },
        { title: "Hardware RAID Redundancy", desc: "RAID-10 configuration included on all storage to protect against drive failure with no data loss." },
        { title: "Enterprise Networking", desc: "Redundant 10 Gbps uplinks, BGP routing, and Tier 1 carrier transit for maximum throughput and availability." },
        { title: "Compliant Infrastructure", desc: "Tier 3 data centres with ISO 27001 and SOC 2 compliance. Suitable for fintech, healthcare, and government workloads." },
        { title: "Managed Support Available", desc: "Add our managed services option for OS maintenance, security patching, and 24/7 proactive monitoring by our team." },
      ]}
      faqs={[
        { q: "How long does provisioning take?", a: "Standard dedicated server configurations are provisioned within 2–24 hours. Custom configurations may take up to 48 hours depending on hardware availability." },
        { q: "Can I choose my operating system?", a: "Yes. We support Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux, and Windows Server. Custom ISO uploads are available on all dedicated plans." },
        { q: "Do I get IPMI access?", a: "Yes. Every dedicated server includes full IPMI/iDRAC/iLO access for remote power management, BIOS configuration, and OS reloads." },
        { q: "Is managed hosting available?", a: "Yes. Our managed dedicated server add-on includes OS updates, security hardening, 24/7 proactive monitoring, and monthly performance reviews." },
        { q: "Can I run Kubernetes on a dedicated server?", a: "Absolutely. Bare metal Kubernetes delivers significantly better performance than virtualised environments. We can pre-configure K8s clusters on request." },
        { q: "What DDoS protection is included?", a: "All dedicated servers include volumetric DDoS mitigation at the network level at no extra cost. Premium Layer 7 protection is available as an add-on." },
      ]}
      pricingNote="All prices in KES. Annual billing saves 15%. Custom hardware configurations available on request."
      ctaHeadline="Get Dedicated Hardware That Never Compromises"
      ctaSubtext="Stop sharing resources. Get enterprise-grade dedicated servers with 100% hardware ownership and the performance your workloads demand."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
