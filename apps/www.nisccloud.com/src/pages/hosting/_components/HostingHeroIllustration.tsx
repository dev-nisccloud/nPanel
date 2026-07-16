import { useEffect, useState } from "react";
import { motion } from "motion/react";

import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal.tsx";

export type HostingHeroMetric = {
  label: string;
  pct: number;
  color: string;
};

export type HostingHeroStat = {
  label: string;
  value: string;
};

export type HostingHeroTerminalLine =
  | { kind: "typing"; text: string; className?: string }
  | { kind: "success"; text: string }
  | { kind: "info"; primary: string; secondary: string }
  | { kind: "muted"; text: string };

export type HostingHeroConfig = {
  hostname: string;
  terminalLines: HostingHeroTerminalLine[];
  metrics: HostingHeroMetric[];
  stats: HostingHeroStat[];
};

export const vpsHeroConfig: HostingHeroConfig = {
  hostname: "root@vps-nairobi-01",
  terminalLines: [
    { kind: "typing", text: "> ssh root@196.201.214.xxx", className: "text-green-400" },
    { kind: "success", text: "Authenticating SSH key..." },
    { kind: "success", text: "Connected to root@vps-nairobi-01" },
    { kind: "success", text: "Ubuntu 24.04 LTS | AMD EPYC 4 vCPU | 8 GB RAM" },
    { kind: "typing", text: "> docker compose up -d", className: "text-green-400" },
    { kind: "success", text: "nginx started on :80" },
    { kind: "success", text: "redis cache online" },
    { kind: "info", primary: "ℹ Deployment complete ", secondary: "4 containers running" },
    { kind: "muted", text: "Success! VPS ready in 4m 32s." },
  ],
  metrics: [
    { label: "CPU Usage", pct: 22, color: "oklch(0.60 0.22 235)" },
    { label: "RAM", pct: 48, color: "oklch(0.55 0.18 195)" },
    { label: "Disk I/O", pct: 15, color: "oklch(0.65 0.16 160)" },
    { label: "Network", pct: 30, color: "oklch(0.58 0.22 300)" },
  ],
  stats: [
    { label: "Deploy Time", value: "<5 min" },
    { label: "Uptime SLA", value: "99.99%" },
    { label: "Bandwidth", value: "10 Gbps" },
  ],
};

export const vdsHeroConfig: HostingHeroConfig = {
  hostname: "root@vds-nairobi-01",
  terminalLines: [
    { kind: "typing", text: "> ssh root@196.201.214.xxx", className: "text-green-400" },
    { kind: "success", text: "Authenticating SSH key..." },
    { kind: "success", text: "Connected to root@vds-nairobi-01" },
    { kind: "success", text: "Ubuntu 24.04 LTS | AMD EPYC 8 vCPU | 32 GB RAM" },
    { kind: "typing", text: "> kubectl apply -f production/", className: "text-green-400" },
    { kind: "success", text: "3 replicas scaled and healthy" },
    { kind: "success", text: "Load balancer routing traffic" },
    { kind: "info", primary: "ℹ Cluster status ", secondary: "all nodes online" },
    { kind: "muted", text: "Success! VDS cluster deployed in 6m 12s." },
  ],
  metrics: [
    { label: "CPU Usage", pct: 15, color: "oklch(0.60 0.22 235)" },
    { label: "RAM", pct: 32, color: "oklch(0.55 0.18 195)" },
    { label: "Disk I/O", pct: 10, color: "oklch(0.65 0.16 160)" },
    { label: "Network", pct: 25, color: "oklch(0.58 0.22 300)" },
  ],
  stats: [
    { label: "Deploy Time", value: "<5 min" },
    { label: "Uptime SLA", value: "99.99%" },
    { label: "Bandwidth", value: "10 Gbps" },
  ],
};

export const dedicatedHeroConfig: HostingHeroConfig = {
  hostname: "root@dedicated-nairobi-01",
  terminalLines: [
    { kind: "typing", text: "> ssh root@196.201.214.xxx", className: "text-green-400" },
    { kind: "success", text: "Authenticating SSH key..." },
    { kind: "success", text: "Connected to root@dedicated-nairobi-01" },
    { kind: "success", text: "Intel Xeon 32 Cores | 256 GB RAM | 4 TB NVMe" },
    { kind: "typing", text: "> systemctl start postgresql", className: "text-green-400" },
    { kind: "success", text: "Database cluster online" },
    { kind: "success", text: "RAID-10 array verified  all disks healthy" },
    { kind: "info", primary: "ℹ Bare-metal status ", secondary: "100% dedicated resources" },
    { kind: "muted", text: "Success! Dedicated server provisioned in 8m 05s." },
  ],
  metrics: [
    { label: "CPU Usage", pct: 12, color: "oklch(0.60 0.22 235)" },
    { label: "RAM", pct: 28, color: "oklch(0.55 0.18 195)" },
    { label: "Disk I/O", pct: 8, color: "oklch(0.65 0.16 160)" },
    { label: "Network", pct: 18, color: "oklch(0.58 0.22 300)" },
  ],
  stats: [
    { label: "Bare Metal", value: "100%" },
    { label: "Uptime SLA", value: "99.99%" },
    { label: "Bandwidth", value: "10 Gbps" },
  ],
};

function TerminalLine({ line }: { line: HostingHeroTerminalLine }) {
  switch (line.kind) {
    case "typing":
      return (
        <TypingAnimation className={line.className ?? "text-green-400"}>
          {line.text}
        </TypingAnimation>
      );
    case "success":
      return (
        <AnimatedSpan className="text-green-500">
          ✔ {line.text}
        </AnimatedSpan>
      );
    case "info":
      return (
        <AnimatedSpan className="text-blue-500">
          <span>{line.primary}</span>
          <span className="pl-2">{line.secondary}</span>
        </AnimatedSpan>
      );
    case "muted":
      return (
        <TypingAnimation className="text-muted-foreground">
          {line.text}
        </TypingAnimation>
      );
  }
}

function LiveMetrics({ metrics }: { metrics: HostingHeroMetric[] }) {
  const [values, setValues] = useState(() => metrics.map((m) => m.pct));

  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) =>
        prev.map((value, index) => {
          const base = metrics[index].pct;
          const delta = (Math.random() - 0.5) * 8;
          return Math.max(4, Math.min(92, Math.round(base + delta)));
        }),
      );
    }, 2200);

    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <div className="space-y-2.5">
      {metrics.map((metric, index) => (
        <div key={metric.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-bold" style={{ color: metric.color }}>
              {values[index]}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: metric.color }}
              animate={{ width: `${values[index]}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HostingHeroIllustration({ config }: { config: HostingHeroConfig }) {
  return (
    <div className="space-y-3 select-none">
      <div className="overflow-hidden rounded-2xl border border-border/40 shadow-lg">
        <div className="flex items-center gap-2 bg-[oklch(0.18_0.015_260)] px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-xs text-white/50">{config.hostname}</span>
          <span className="ml-auto text-[10px] font-semibold text-green-400">● Connected</span>
        </div>
        <Terminal
          hideHeader
          sequence
          startOnView
          className="max-w-none rounded-none border-0 bg-[oklch(0.12_0.015_260)] font-mono text-xs [&_code]:text-green-400"
        >
          {config.terminalLines.map((line, index) => (
            <TerminalLine key={index} line={line} />
          ))}
        </Terminal>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-md">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Live Resource Monitor
        </div>
        <LiveMetrics metrics={config.metrics} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {config.stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-center"
          >
            <div className="text-sm font-extrabold text-primary">{value}</div>
            <div className="mt-0.5 text-[9px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
