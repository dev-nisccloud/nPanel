import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal.tsx";
import { cn } from "@/lib/utils.ts";

const wrapClass = "!block w-full min-w-0 whitespace-pre-wrap break-words";
export type HostingHeroTerminalLine =
  | { kind: "typing"; text: string; className?: string }
  | { kind: "success"; text: string }
  | { kind: "info"; primary: string; secondary: string }
  | { kind: "muted"; text: string };

export type HostingHeroConfig = {
  hostname: string;
  terminalLines: HostingHeroTerminalLine[];
};

export const vpsHeroConfig: HostingHeroConfig = {
  hostname: "root@vps-prod-01",
  terminalLines: [
    {
      kind: "typing",
      text: "> ssh -o StrictHostKeyChecking=no \\\n    root@196.201.214.xxx \\\n    -i ~/.ssh/nisc_vps_key",
      className: "text-green-400",
    },
    { kind: "success", text: "Authenticating with ed25519 SSH key\n(SHA256:9f3a...c21b)..." },
    { kind: "success", text: "Connected to root@vps-prod-01\nSSH ready · low latency" },
    { kind: "success", text: "Ubuntu 24.04 LTS | AMD EPYC 4 vCPU\n8 GB RAM | 160 GB NVMe" },
    {
      kind: "typing",
      text: "> docker compose -f /opt/stack/ \\\n    docker-compose.prod.yml up -d \\\n    --remove-orphans",
      className: "text-green-400",
    },
    { kind: "success", text: "Pulling nginx:1.27-alpine, redis:7.2,\nnode:20-alpine..." },
    { kind: "success", text: "nginx reverse proxy listening on\n0.0.0.0:80, 0.0.0.0:443" },
    { kind: "success", text: "redis cache online, 512 MB allocated,\npersistence enabled" },
    { kind: "info", primary: "ℹ Deployment complete\n", secondary: "4 containers healthy · 0 restarts" },
    { kind: "muted", text: "Success! VPS stack deployed in 4m 32s.\nMonitoring active." },
  ],
};

export const vdsHeroConfig: HostingHeroConfig = {
  hostname: "root@vds-prod-01",
  terminalLines: [
    {
      kind: "typing",
      text: "> ssh -o StrictHostKeyChecking=no \\\n    root@196.201.214.xxx \\\n    -i ~/.ssh/nisc_vds_key",
      className: "text-green-400",
    },
    { kind: "success", text: "Authenticating with ed25519 SSH key\n(SHA256:7b2e...a84f)..." },
    { kind: "success", text: "Connected to root@vds-prod-01\nSSH ready · low latency" },
    { kind: "success", text: "Ubuntu 24.04 LTS | AMD EPYC 8 vCPU\n32 GB RAM | 500 GB NVMe" },
    {
      kind: "typing",
      text: "> kubectl apply -f /etc/k8s/production/ \\\n    --recursive --server-side \\\n    --force-conflicts",
      className: "text-green-400",
    },
    { kind: "success", text: "deployment/api-backend scaled to 3 replicas\nall pods Running" },
    { kind: "success", text: "ingress-nginx configured · TLS cert issued\nfor *.nisccloud.co.ke" },
    { kind: "success", text: "Load balancer routing traffic across\n2 availability zones" },
    { kind: "info", primary: "ℹ Cluster status\n", secondary: "6 nodes online · 0 pending workloads" },
    { kind: "muted", text: "Success! VDS cluster deployed in 6m 12s.\nAuto-scaling enabled." },
  ],
};

export const dedicatedHeroConfig: HostingHeroConfig = {
  hostname: "root@dedicated-prod-01",
  terminalLines: [
    {
      kind: "typing",
      text: "> ssh -o StrictHostKeyChecking=no \\\n    root@196.201.214.xxx \\\n    -i ~/.ssh/nisc_baremetal_key",
      className: "text-green-400",
    },
    { kind: "success", text: "Authenticating with ed25519 SSH key\n(SHA256:4c91...d7e2)..." },
    { kind: "success", text: "Connected to root@dedicated-prod-01\nIPMI reachable · low latency" },
    { kind: "success", text: "Intel Xeon Gold 32 Cores | 256 GB ECC\n4 TB NVMe RAID-10" },
    {
      kind: "typing",
      text: "> systemctl enable --now postgresql@16-main && \\\n    pg_ctlcluster 16 main start",
      className: "text-green-400",
    },
    { kind: "success", text: "PostgreSQL 16 cluster online\nstreaming replication configured" },
    { kind: "success", text: "RAID-10 array verified, 4/4 disks healthy,\n3.2 TB usable" },
    { kind: "success", text: "Network bonded 2x10 Gbps\nfull dedicated bandwidth allocated" },
    { kind: "info", primary: "ℹ Bare-metal status\n", secondary: "100% dedicated · zero hypervisor overhead" },
    { kind: "muted", text: "Success! Dedicated server provisioned in 8m 05s.\nIPMI console ready." },
  ],
};

function TerminalLine({ line }: { line: HostingHeroTerminalLine }) {
  switch (line.kind) {
    case "typing":
      return (
        <TypingAnimation className={cn(wrapClass, line.className ?? "text-green-400")}>
          {line.text}
        </TypingAnimation>
      );
    case "success":
      return (
        <AnimatedSpan className={cn(wrapClass, "text-green-500")}>
          ✔ {line.text}
        </AnimatedSpan>
      );
    case "info":
      return (
        <AnimatedSpan className={cn(wrapClass, "text-blue-500")}>
          <span>{line.primary}</span>
          <span>{line.secondary}</span>
        </AnimatedSpan>
      );
    case "muted":
      return (
        <TypingAnimation className={cn(wrapClass, "text-muted-foreground")}>
          {line.text}
        </TypingAnimation>
      );
  }
}

export function HostingHeroIllustration({ config }: { config: HostingHeroConfig }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border/40 shadow-xl">
      <div className="flex items-center gap-2 bg-[oklch(0.18_0.015_260)] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="h-3 w-3 shrink-0 rounded-full bg-red-500/80" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-yellow-500/80" />
        <div className="h-3 w-3 shrink-0 rounded-full bg-green-500/80" />
        <span className="ml-2 min-w-0 truncate font-mono text-xs text-white/50 sm:text-sm">
          {config.hostname}
        </span>
        <span className="ml-auto shrink-0 text-[10px] font-semibold text-green-400 sm:text-xs">
          ● Connected
        </span>
      </div>
      <Terminal
        hideHeader
        sequence
        loop
        startOnView={false}
        loopDelay={2500}
        scrollClassName="min-h-[360px] max-h-[min(65vh,460px)]"
        className="max-w-none rounded-none border-0 bg-[oklch(0.12_0.015_260)] font-mono text-xs leading-relaxed sm:text-[13px] [&_code]:text-green-400"
      >
        {config.terminalLines.map((line, index) => (
          <TerminalLine key={index} line={line} />
        ))}
      </Terminal>
    </div>
  );
}
