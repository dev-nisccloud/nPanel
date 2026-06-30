import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ── data ─────────────────────────────────────────────── */

const EVENTS = [
  { id: 1, color: "#ef4444", label: "SQL injection blocked",     sub: "WAF rule #4421 — 185.220.x.x",  time: "just now" },
  { id: 2, color: "#16a34a", label: "Malware scan — Clean",      sub: "4× daily scan complete",         time: "1h ago"   },
  { id: 3, color: "#2563eb", label: "DDoS absorbed — 3.2K req/s",sub: "Traffic normal after 4 min",     time: "2h ago"   },
  { id: 4, color: "#7c3aed", label: "SSL auto-renewed",          sub: "Valid 365 more days · SHA-256",  time: "2d ago"   },
  { id: 5, color: "#ea580c", label: "XSS attempt blocked",       sub: "WAF rule #2109 — 91.108.x.x",   time: "3h ago"   },
];

const BAR_HEIGHTS = [60, 85, 72, 100, 78, 110, 90];
const BAR_DAYS    = ["M", "T", "W", "T", "F", "S", "S"];

const SITES = [
  { name: "yourbusiness.co.ke", status: "SSL Active",  color: "#16a34a" },
  { name: "shop.yourbrand.com", status: "WAF On",      color: "#16a34a" },
  { name: "api.yourbrand.com",  status: "DDoS Shield", color: "#d97706" },
];

/* ── helpers ──────────────────────────────────────────── */

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

/* ── main component ───────────────────────────────────── */

export default function SecurityDashboardScreen() {
  const [threatCount, setThreatCount]     = useState(2841);
  const [visibleEvents, setVisibleEvents] = useState([0, 1, 2]);
  const [scanning, setScanning]           = useState(false);
  const [scanProgress, setScanProgress]   = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setThreatCount((n) => n + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleEvents(([, b, c]) => {
        const next = (c + 1) % EVENTS.length;
        return [b, c, next];
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let frame: number;
    const runScan = () => {
      setScanning(true);
      setScanProgress(0);
      let p = 0;
      const step = () => {
        p += 1.2;
        setScanProgress(Math.min(p, 100));
        if (p < 100) frame = requestAnimationFrame(step);
        else setTimeout(() => setScanning(false), 600);
      };
      frame = requestAnimationFrame(step);
    };
    runScan();
    const id = setInterval(runScan, 8000);
    return () => { clearInterval(id); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-50 font-mono text-gray-900 select-none">

      {/* ── scan line sweep ── */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 z-30 h-[2px]"
        style={{
          background: "linear-gradient(to right, transparent, #3b82f6, transparent)",
          boxShadow: "0 0 12px 3px rgba(59,130,246,0.4)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
      />

      {/* ── top bar ── */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-wide text-blue-600">NISC CLOUD</span>
          <span className="text-[8px] text-gray-300">/</span>
          <span className="text-[8px] text-gray-500">Security Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <PulseDot color="#16a34a" />
          <span className="text-[8px] text-emerald-600">Live</span>
        </div>
      </div>

      {/* ── stats row ── */}
      <div className="flex shrink-0 gap-2 border-b border-gray-200 bg-white px-3 py-2">
        {/* Score */}
        <div className="flex w-16 flex-col rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1.5">
          <span className="text-[7px] uppercase tracking-widest text-gray-400">Score</span>
          <span className="text-xl font-extrabold leading-none text-emerald-600">A+</span>
        </div>
        {/* Threats */}
        <div className="flex flex-1 flex-col rounded-lg bg-pink-50 border border-pink-100 px-2 py-1.5">
          <span className="text-[7px] uppercase tracking-widest text-gray-400">Threats Blocked</span>
          <motion.span
            key={threatCount}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-extrabold leading-none text-pink-600"
          >
            {threatCount.toLocaleString()}
          </motion.span>
        </div>
        {/* SSL */}
        <div className="flex flex-1 flex-col rounded-lg bg-slate-50 border border-gray-200 px-2 py-1.5">
          <span className="text-[7px] uppercase tracking-widest text-gray-400">SSL</span>
          <span className="text-[11px] font-bold leading-none text-emerald-600 mt-1">Active</span>
          <span className="text-[7px] text-gray-400 mt-0.5">SHA-256</span>
        </div>
        {/* Uptime */}
        <div className="flex flex-1 flex-col rounded-lg bg-blue-50 border border-blue-100 px-2 py-1.5">
          <span className="text-[7px] uppercase tracking-widest text-gray-400">Uptime</span>
          <span className="text-[11px] font-bold leading-none text-blue-600 mt-1">99.98%</span>
          <span className="text-[7px] text-gray-400 mt-0.5">30 days</span>
        </div>
      </div>

      {/* ── scan progress bar ── */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="shrink-0 bg-white px-3 pt-1.5 pb-1 border-b border-gray-100"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] text-blue-600 tracking-wider">SCANNING FILES…</span>
              <span className="text-[7px] text-gray-400">{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── main body ── */}
      <div className="flex min-h-0 flex-1 gap-2 bg-slate-50 px-3 py-2">

        {/* Left: bar chart */}
        <div className="flex w-28 shrink-0 flex-col">
          <span className="mb-1.5 text-[7px] uppercase tracking-widest text-gray-400">Firewall — 7 days</span>
          <div className="flex flex-1 items-end gap-1">
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <motion.div
                  className="w-full rounded-sm bg-gradient-to-t from-blue-600 to-cyan-400"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                  style={{ minHeight: 2 }}
                />
                <span className="text-[6px] text-gray-400">{BAR_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: event feed */}
        <div className="flex flex-1 flex-col">
          <span className="mb-1.5 text-[7px] uppercase tracking-widest text-gray-400">Security Events</span>
          <div className="flex flex-col gap-1 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {visibleEvents.map((idx) => {
                const ev = EVENTS[idx];
                return (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-start gap-1.5 rounded-md bg-white border border-gray-100 px-2 py-1.5 shadow-sm"
                  >
                    <PulseDot color={ev.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[8px] font-semibold" style={{ color: ev.color }}>
                        {ev.label}
                      </p>
                      <p className="truncate text-[7px] text-gray-400">{ev.sub}</p>
                    </div>
                    <span className="shrink-0 text-[7px] text-gray-400">{ev.time}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── protected sites row ── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2">
        <span className="mb-1.5 block text-[7px] uppercase tracking-widest text-gray-400">Protected Sites</span>
        <div className="flex gap-1.5">
          {SITES.map((site) => (
            <div key={site.name} className="flex flex-1 items-center gap-1 rounded-md bg-slate-50 border border-gray-200 px-2 py-1">
              <PulseDot color={site.color} />
              <div className="min-w-0">
                <p className="truncate text-[7px] font-semibold text-gray-700">{site.name}</p>
                <p className="text-[6px] font-medium" style={{ color: site.color }}>{site.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
