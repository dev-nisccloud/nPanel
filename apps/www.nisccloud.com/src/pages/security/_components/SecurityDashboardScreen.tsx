import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Flame,
  ScanLine,
  Lock,
  Database,
  Activity,
} from "lucide-react";

/* ── data ─────────────────────────────────────────────── */

const EVENTS = [
  { id: 1, tone: "danger" as const, label: "SQL injection blocked", detail: "WAF · 185.220.x.x" },
  { id: 2, tone: "ok" as const, label: "Malware scan complete", detail: "Clean · 4× daily" },
  { id: 3, tone: "info" as const, label: "DDoS traffic absorbed", detail: "3.2K req/s · 4 min" },
  { id: 4, tone: "ok" as const, label: "SSL certificate renewed", detail: "Valid 365 days" },
  { id: 5, tone: "danger" as const, label: "XSS attempt blocked", detail: "WAF · 91.108.x.x" },
  { id: 6, tone: "ok" as const, label: "Backup stored off-site", detail: "Encrypted · daily" },
];

const LAYERS = [
  {
    key: "waf",
    icon: Flame,
    label: "Firewall",
    status: "Blocking",
    hint: "WAF active",
    bars: [42, 68, 55, 90, 72, 100, 78],
    color: "#f97316",
  },
  {
    key: "ssl",
    icon: Lock,
    label: "SSL",
    status: "Encrypted",
    hint: "SHA-256",
    spark: [88, 90, 92, 91, 95, 97, 100],
    color: "#38b6ff",
  },
  {
    key: "scan",
    icon: ScanLine,
    label: "Malware",
    status: "Clean",
    hint: "Scanned 1h ago",
    spark: [100, 100, 98, 100, 100, 99, 100],
    color: "#10b981",
  },
  {
    key: "backup",
    icon: Database,
    label: "Backups",
    status: "Current",
    hint: "Off-site daily",
    bars: [70, 70, 70, 70, 70, 70, 100],
    color: "#06b6d4",
  },
] as const;

const TONE = {
  danger: { dot: "#ef4444", text: "text-red-600" },
  ok: { dot: "#10b981", text: "text-emerald-600" },
  info: { dot: "#38b6ff", text: "text-sky-600" },
};

/* ── helpers ──────────────────────────────────────────── */

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

function MiniBars({ values, color, active }: { values: readonly number[]; color: string; active: boolean }) {
  return (
    <div className="flex h-7 w-full items-end gap-[3px]">
      {values.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-[2px]"
          style={{ backgroundColor: color, opacity: active ? 0.85 : 0.45 }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.55, delay: 0.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

function MiniSpark({ values, color, active }: { values: readonly number[]; color: string; active: boolean }) {
  const w = 100;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const areaPath = `M0 ${h} ${coords.map(([x, y]) => `L${x} ${y}`).join(" ")} L${w} ${h} Z`;
  const gradId = `spark-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={active ? 0.28 : 0.14} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.65}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function ShieldMark() {
  return (
    <div className="relative flex h-[4.75rem] w-[4.75rem] items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(56,182,255,0.22) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 76 76" aria-hidden>
        <circle cx="38" cy="38" r="33" fill="none" stroke="rgba(56,182,255,0.12)" strokeWidth="3.5" />
        <motion.circle
          cx="38"
          cy="38"
          r="33"
          fill="none"
          stroke="#38b6ff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={207}
          initial={{ strokeDashoffset: 207 }}
          animate={{ strokeDashoffset: 18 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_1px_8px_rgba(56,182,255,0.18)] ring-1 ring-[#38b6ff]/15">
        <ShieldCheck className="h-5 w-5 text-[#38b6ff]" strokeWidth={2.25} />
      </div>
    </div>
  );
}

/* ── main ─────────────────────────────────────────────── */

export default function SecurityDashboardScreen() {
  const [threatCount, setThreatCount] = useState(2841);
  const [eventIndex, setEventIndex] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setThreatCount((n) => n + Math.floor(Math.random() * 2) + 1);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setEventIndex((i) => (i + 1) % EVENTS.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveLayer((i) => (i + 1) % LAYERS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let frame = 0;
    const runScan = () => {
      setScanning(true);
      setScanProgress(0);
      let p = 0;
      const step = () => {
        p += 1.4;
        setScanProgress(Math.min(p, 100));
        if (p < 100) frame = requestAnimationFrame(step);
        else setTimeout(() => setScanning(false), 700);
      };
      frame = requestAnimationFrame(step);
    };
    const start = setTimeout(runScan, 1200);
    const id = setInterval(runScan, 10000);
    return () => {
      clearTimeout(start);
      clearInterval(id);
      cancelAnimationFrame(frame);
    };
  }, []);

  const event = EVENTS[eventIndex];
  const tone = TONE[event.tone];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f7fafc] text-slate-800 select-none">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(56,182,255,0.10), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(16,185,129,0.06), transparent 50%)",
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-x-0 z-20 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(56,182,255,0.55), transparent)",
          boxShadow: "0 0 10px 2px rgba(56,182,255,0.25)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: "linear" }}
      />

      {/* top bar */}
      <header className="relative z-10 flex h-7 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img
            src="/nisccloud-logo.svg"
            alt="Nisc Cloud"
            className="h-4 w-auto object-contain object-left"
          />
          <span className="h-2.5 w-px bg-slate-200" />
          <span className="text-[8px] font-medium text-slate-500">Security</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-100">
          <PulseDot color="#10b981" />
          <span className="text-[8px] font-semibold text-emerald-700">Protected</span>
        </div>
      </header>

      {/* body */}
      <div className="relative z-10 flex min-h-0 flex-1 gap-3 px-3 py-2.5">
        <div className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center rounded-xl bg-white/90 px-2 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
          <ShieldMark />
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-1.5 text-[11px] font-bold tracking-tight text-slate-800"
          >
            A+ Secure
          </motion.p>
          <p className="text-[7px] text-slate-400">All systems healthy</p>

          <div className="mt-2.5 w-full space-y-1.5">
            <div className="flex items-end justify-between rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-100">
              <div>
                <p className="text-[6.5px] font-medium uppercase tracking-wider text-slate-400">Threats blocked</p>
                <motion.p
                  key={threatCount}
                  initial={{ opacity: 0.4, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] font-bold leading-none text-slate-800 tabular-nums"
                >
                  {threatCount.toLocaleString()}
                </motion.p>
              </div>
              <Activity className="mb-0.5 h-3 w-3 text-[#38b6ff]/70" />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[7px] text-slate-400">Uptime</span>
              <span className="text-[8px] font-semibold text-emerald-600 tabular-nums">99.98%</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5">
            {LAYERS.map((layer, i) => {
              const Icon = layer.icon;
              const isActive = activeLayer === i;
              const isScan = layer.key === "scan" && scanning;
              const hasBars = "bars" in layer;

              return (
                <motion.div
                  key={layer.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                  className={`relative flex flex-col overflow-hidden rounded-xl bg-white/90 p-2 ring-1 transition-shadow duration-500 ${
                    isActive
                      ? "shadow-[0_4px_14px_rgba(56,182,255,0.12)] ring-[#38b6ff]/35"
                      : "shadow-[0_1px_0_rgba(15,23,42,0.03)] ring-slate-200/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md transition-colors duration-500 ${
                        isActive ? "bg-[#38b6ff]/12 text-[#38b6ff]" : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      <Icon className="h-3 w-3" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1 pl-1.5">
                      <p className="text-[7px] font-medium uppercase tracking-wider text-slate-400">{layer.label}</p>
                      <p className="text-[10px] font-bold leading-tight text-slate-800">{layer.status}</p>
                    </div>
                    <PulseDot color={isActive ? "#38b6ff" : "#10b981"} />
                  </div>

                  <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-end">
                    {hasBars ? (
                      <MiniBars values={layer.bars} color={layer.color} active={isActive} />
                    ) : (
                      <MiniSpark values={layer.spark} color={layer.color} active={isActive} />
                    )}
                    <p className="mt-1 truncate text-[7px] text-slate-400">
                      {isScan ? `Scanning… ${Math.round(scanProgress)}%` : layer.hint}
                    </p>
                  </div>

                  {isScan && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-slate-100">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#38b6ff] to-cyan-400"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="shrink-0 overflow-hidden rounded-xl bg-white/90 px-2.5 py-2 ring-1 ring-slate-200/70">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[7px] font-medium uppercase tracking-wider text-slate-400">Live activity</span>
              <span className="flex items-center gap-1 text-[7px] text-slate-400">
                <PulseDot color="#38b6ff" />
                Updating
              </span>
            </div>
            <div className="relative h-[2.1rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center gap-2"
                >
                  <PulseDot color={tone.dot} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[9px] font-semibold ${tone.text}`}>{event.label}</p>
                    <p className="truncate text-[7px] text-slate-400">{event.detail}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
