import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Globe, Terminal } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

// ─── Hero Illustration ────────────────────────────────────────────────────────

function VpsIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* Top terminal card */}
      <div className="rounded-2xl overflow-hidden border border-border/40 shadow-lg bg-[oklch(0.12_0.015_260)]">
        <div className="px-4 py-2.5 bg-[oklch(0.18_0.015_260)] flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-white/50 ml-2 text-xs font-mono">root@vps-nairobi-01</span>
          <span className="ml-auto text-green-400 text-[10px] font-semibold">● Connected</span>
        </div>
        <div className="p-4 font-mono text-xs space-y-1.5 text-green-400">
          <div>$ ssh root@196.201.214.xxx</div>
          <div className="text-white/50">Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8)</div>
          <div className="text-white/50">AMD EPYC 4 vCPU | 8 GB RAM | 160 GB NVMe</div>
          <div>$ docker run <span className="text-cyan-400">-d</span> -p 80:80 nginx</div>
          <div className="text-white/50">f3a1b2c4d5e6... Container started on :80</div>
          <div>$ <span className="animate-pulse">_</span></div>
        </div>
      </div>

      {/* Resource monitor row */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-md p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Live Resource Monitor</div>
        <div className="space-y-2.5">
          {[
            { label: "CPU Usage", pct: 22, color: "oklch(0.60 0.22 235)" },
            { label: "RAM", pct: 48, color: "oklch(0.55 0.18 195)" },
            { label: "Disk I/O", pct: 15, color: "oklch(0.65 0.16 160)" },
            { label: "Network", pct: 30, color: "oklch(0.58 0.22 300)" },
          ].map(({ label, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Deploy Time", value: "<5 min" },
          { label: "Uptime SLA", value: "99.99%" },
          { label: "Bandwidth", value: "10 Gbps" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
            <div className="text-sm font-extrabold text-primary">{value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[oklch(0.18_0.015_260)] px-5 py-2.5 text-white text-sm font-bold flex items-center justify-between">
            <span>VPS Monitor</span>
            <span className="text-green-400 text-xs font-semibold">● Online</span>
          </div>
          <div className="p-4 space-y-3">
            {[["CPU Usage","22%","oklch(0.60 0.22 235)"],["RAM Usage","48%","oklch(0.55 0.18 195)"],["Disk I/O","15%","oklch(0.65 0.16 160)"],["Network","8 Gbps","oklch(0.58 0.22 300)"]].map(([label, value, color]) => (
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
    headline: "Your VPS ready in under 5 minutes",
    body: "Choose your OS, add your SSH key, and click deploy. No waiting, no provisioning delays. Your AMD EPYC-powered server is live and accessible in minutes.",
    bullets: [
      "Ubuntu, Debian, CentOS, AlmaLinux — your choice",
      "SSH access available within 5 minutes of payment",
      "One-click LAMP, LEMP, Docker, and Node.js stacks",
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
            <div className="text-white/60">AMD EPYC 4 vCPU | 8GB RAM</div>
            <div>$ <span className="text-white">docker run -d nginx</span></div>
            <div className="text-white/60">Container started on :80</div>
            <div>$ <span className="animate-pulse">_</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">&lt;5 min</div>
            <div className="text-[10px] text-muted-foreground">Deployment time</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">Root</div>
            <div className="text-[10px] text-muted-foreground">Full access</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Popular Use Cases",
    headline: "Any workload. One powerful platform.",
    body: "Kenyan businesses use our VPS for everything from fintech APIs to WooCommerce stores to SaaS platforms. Dedicated resources mean your app performs consistently.",
    bullets: [
      "WooCommerce and eCommerce stores with full resource isolation",
      "M-Pesa payment APIs and fintech backends",
      "SaaS platforms, CRMs, and custom business apps",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-2.5">
        {[
          { icon: "🛒", label: "WooCommerce Store", desc: "High-traffic, dedicated resources" },
          { icon: "💳", label: "M-Pesa Payment API", desc: "Low latency, secure HTTPS" },
          { icon: "🗄️", label: "Database Server", desc: "MySQL, PostgreSQL, MongoDB" },
          { icon: "⚙️", label: "Custom SaaS App", desc: "Full stack: Node / Laravel / Django" },
          { icon: "📧", label: "Private Email Server", desc: "Unlimited mailboxes, full control" },
          { icon: "🧪", label: "Dev / Test Environment", desc: "Isolated staging for your team" },
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

export default function VpsHostingPage() {
  return (
    <ServicePageShell
      badge="VPS Servers"
      headline={<>Dedicated Power. <span className="text-primary">Kenyan Speed.</span> VPS Built for Serious Businesses.</>}
      subtext="Full root access, guaranteed resources, and Nairobi-based infrastructure. Deploy your custom stack in minutes — no shared resources, no compromises."
      serviceType="hosting"
      heroIllustration={<VpsIllustration />}
      heroTrustBadge={{ line1: "AMD EPYC Processors", line2: "Deployed in under 5 minutes" }}
      trustStats={[
        { value: "100+", label: "VPS Servers Active" },
        { value: "99.99%", label: "Network Uptime SLA" },
        { value: "10 Gbps", label: "Network Bandwidth" },
        { value: "<5 min", label: "Average Deployment Time" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "Guaranteed Dedicated Resources",
          desc: "Unlike shared hosting, your CPU cores, RAM, and SSD are yours alone. No noisy neighbours, no resource contention — consistent performance at all times.",
        },
        {
          icon: <Cpu size={20} />,
          title: "Latest-Gen AMD EPYC CPUs",
          desc: "Powered by AMD EPYC processors, the same architecture used by major cloud providers. Your workloads get cutting-edge compute performance.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "NVMe SSD RAID Storage",
          desc: "Enterprise NVMe SSD in RAID-10 configuration delivers 3,500 MB/s read speeds. Databases, file servers, and apps run at full speed.",
        },
        {
          icon: <Network size={20} />,
          title: "10 Gbps Network Port",
          desc: "Each VPS is connected to a 10 Gbps uplink. Handle high traffic, large file transfers, and media streaming without bandwidth bottlenecks.",
        },
        {
          icon: <Shield size={20} />,
          title: "DDoS Protection Included",
          desc: "Industry-grade DDoS mitigation is included on all VPS plans. Volumetric attacks are scrubbed at the network edge before reaching your server.",
        },
        {
          icon: <Zap size={20} />,
          title: "Instant Provisioning",
          desc: "Your VPS is deployed and ready in under 5 minutes. Choose your OS, add your SSH key, and start deploying your applications immediately.",
        },
        {
          icon: <Globe size={20} />,
          title: "Nairobi Data Centre Location",
          desc: "Servers physically located in Nairobi ensure the lowest latency for your East African users. Ideal for Kenyan SaaS apps, fintech, and government portals.",
        },
        {
          icon: <Terminal size={20} />,
          title: "Full Root Access",
          desc: "Complete control over your server environment. Install any software, configure custom kernel parameters, and run Docker containers without restrictions.",
        },
      ]}
      plans={[
        {
          id: "vps-starter",
          name: "VPS Starter",
          price: 2000,
          period: "mo",
          features: [
            "2 vCPU Cores (AMD EPYC)",
            "4 GB RAM",
            "80 GB NVMe SSD",
            "2 TB Monthly Bandwidth",
            "1 IPv4 Address",
            "Full Root Access",
            "Choice of OS (Ubuntu/CentOS/Debian)",
            "DDoS Protection",
            "99.99% Uptime SLA",
            "Basic Monitoring",
          ],
        },
        {
          id: "vps-business-popular",
          name: "VPS Business",
          price: 4000,
          period: "mo",
          features: [
            "4 vCPU Cores (AMD EPYC)",
            "8 GB RAM",
            "160 GB NVMe SSD",
            "5 TB Monthly Bandwidth",
            "2 IPv4 Addresses",
            "Full Root Access",
            "Choice of OS",
            "DDoS Protection",
            "Daily Automated Backups",
            "Advanced Monitoring and Alerts",
            "Control Panel (Optional)",
            "Priority Support",
          ],
        },
        {
          id: "vps-enterprise",
          name: "VPS Enterprise",
          price: 8000,
          period: "mo",
          features: [
            "8 vCPU Cores (AMD EPYC)",
            "16 GB RAM",
            "320 GB NVMe SSD",
            "10 TB Monthly Bandwidth",
            "4 IPv4 Addresses",
            "Full Root Access",
            "Choice of OS",
            "DDoS Protection",
            "Hourly Automated Backups",
            "Full Monitoring Stack (Grafana)",
            "Control Panel Included",
            "Private Network VLAN",
            "Dedicated Account Manager",
            "24/7 Emergency Support Line",
          ],
        },
      ]}
      addons={[
        { id: "vps-addon-backup", label: "Additional Backup Storage (100 GB)", price: 500, period: "mo" },
        { id: "vps-addon-ip", label: "Additional IPv4 Address", price: 150, period: "mo" },
        { id: "vps-addon-panel", label: "cPanel/WHM License", price: 800, period: "mo" },
      ]}
      process={[
        { num: "01", title: "Configure Your VPS", desc: "Choose your plan, operating system (Ubuntu, CentOS, Debian, AlmaLinux), and preferred data centre location. Add your SSH public key for instant secure access." },
        { num: "02", title: "Instant Deployment", desc: "Your VPS is provisioned in under 5 minutes. You will receive your IP address, root credentials, and connection guide by email and SMS." },
        { num: "03", title: "Deploy Your Stack", desc: "SSH in and deploy your applications. Use our one-click app scripts for LAMP, LEMP, Docker, Node.js, or any custom stack you need." },
        { num: "04", title: "Monitor and Scale", desc: "Use our monitoring dashboard to track CPU, RAM, disk, and network usage. Scale up resources with one click when your business demands it." },
      ]}
      whyPoints={[
        { title: "Guaranteed Resources — Not Shared", desc: "Every vCPU and GB of RAM is dedicated to your VPS alone. You always get the performance you are paying for." },
        { title: "Kenyan Data Residency", desc: "Your data stays in Kenya. Critical for fintech companies, healthcare platforms, and government projects that must comply with local data protection laws." },
        { title: "Upgrade Without Downtime", desc: "Need more RAM or CPU? We upgrade your VPS resources live in most cases. No migration, no rebuild, no downtime for your users." },
        { title: "Enterprise Networking Infrastructure", desc: "Redundant 10 Gbps uplinks, BGP routing, and carrier-grade switches ensure your server is always reachable with the lowest possible latency." },
        { title: "Full Control, No Restrictions", desc: "Run Docker, Kubernetes, custom firewall rules, VPN servers, game servers, or any workload. Root access means total freedom." },
        { title: "Managed Support Available", desc: "Don't want to manage your server yourself? Add our managed services option and our Nairobi sysadmin team handles updates, security patches, and optimisation." },
      ]}
      faqs={[
        { q: "What operating systems are available?", a: "We offer Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8/9, AlmaLinux 8/9, and Rocky Linux 8/9. Custom ISO uploads are available on Enterprise plans." },
        { q: "Can I run Docker or Kubernetes on my VPS?", a: "Yes, absolutely. You have full root access and can install and run Docker, Docker Compose, or Kubernetes clusters without any restrictions from our side." },
        { q: "How does the 99.99% uptime SLA work?", a: "We guarantee 99.99% monthly network uptime. If we fail to meet this SLA, you receive service credits equal to 10x the downtime value. We publish real-time status at status.nisccloud.co.ke." },
        { q: "Is managed hosting available for VPS?", a: "Yes. Our managed VPS add-on includes OS updates, security hardening, 24/7 proactive monitoring, incident response, and monthly performance reports handled by our Nairobi team." },
        { q: "Can I scale my VPS up later?", a: "Yes. You can upgrade CPU, RAM, and storage at any time from your dashboard. Upgrades are applied within 15 minutes and typically require only a brief reboot." },
        { q: "Do you provide DDoS protection?", a: "All VPS plans include volumetric DDoS mitigation at the network level at no extra cost. We can absorb attacks up to 10 Gbps. For advanced Layer 7 protection, ask about our premium DDoS service." },
      ]}
      pricingNote="All prices in KES. Annual billing saves 15%. Custom configurations available for enterprise clients."
      ctaHeadline="Get a VPS That Performs as Hard as You Do"
      ctaSubtext="Stop over-paying for sluggish shared hosting or expensive international VPS providers. Get enterprise-grade performance with Nairobi servers and local support."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
