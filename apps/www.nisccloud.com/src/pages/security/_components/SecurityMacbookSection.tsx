import { ShieldCheck, ScanLine, Flame, Database, Activity, Lock } from "lucide-react";
import { MacbookScroll } from "@/components/ui/macbook-scroll.tsx";
import SecurityDashboardScreen from "./SecurityDashboardScreen.tsx";

const features = [
  { icon: ShieldCheck, label: "SSL Certificate Included", color: "text-emerald-500 bg-emerald-500/10" },
  { icon: Flame, label: "Web Application Firewall", color: "text-orange-500 bg-orange-500/10" },
  { icon: ScanLine, label: "Daily Malware Scanning", color: "text-blue-500 bg-blue-500/10" },
  { icon: Database, label: "Secure Daily Backups", color: "text-violet-500 bg-violet-500/10" },
  { icon: Lock, label: "DDoS Protection", color: "text-red-500 bg-red-500/10" },
  { icon: Activity, label: "24/7 Site Monitoring", color: "text-cyan-500 bg-cyan-500/10" },
];

export default function SecurityMacbookSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-background">
      {/* subtle tinted glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Heading above the MacBook */}
        <div className="mx-auto max-w-3xl px-4 pt-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck size={12} /> Live Security Dashboard
          </span>
          <h2 className="mb-4 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            Watch Your Website's
            <br />
            <span className="text-primary">Shield in Action</span>
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            Every plan comes with a real-time security dashboard. See threats blocked,
            malware scans, uptime, SSL status, and DDoS events — all from one place.
          </p>
        </div>

        {/* 6-feature pill row */}
        <div className="mx-auto mt-6 max-w-4xl px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {features.map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${color}`}
              >
                <Icon size={12} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* MacBook scroll — live animated dashboard on-screen */}
        <div className="w-full overflow-hidden">
          <MacbookScroll
            showGradient={false}
            content={<SecurityDashboardScreen />}
            title={
              <span className="sr-only">
                Nisc Cloud Security Dashboard — real-time threat monitoring
              </span>
            }
          />
        </div>
      </div>
    </section>
  );
}
