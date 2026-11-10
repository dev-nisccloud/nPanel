import {
  ArrowUpRight,
  Globe2,
  Mail,
  CreditCard,
  LifeBuoy,
  LayoutDashboard,
  Check,
} from "lucide-react";
import { useRef } from "react";
import { useInView } from "motion/react";

const SPEED_TRACE = "M66.2 416 H120.9 L144.2 395 L187.9 437.3 L208.3 416 H485.3";

export function HostingPerformanceArtwork() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  return (
    <figure ref={ref} className={`mx-auto w-full max-w-[560px] ${inView ? "" : "brg-paused"}`}>
      <div className="overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
        <svg
          viewBox="0 6 506 462"
          className="block h-auto w-full"
          role="img"
          aria-label="A customer beside an illustrative website speed report for mywebpage.co.ke"
        >
          <defs>
            <linearGradient id="ps-scan" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="ps-score-card">
              <rect x="166.2" y="235.3" width="319.8" height="97.7" rx="7" />
            </clipPath>
          </defs>
          <image href="/artwork/page-speed-clean.svg" width="520" height="481" />

          <rect className="ps-caret" x="162" y="161" width="1.6" height="17" fill="#ffffff" />

          <g clipPath="url(#ps-score-card)">
            <rect className="ps-scan" x="96" y="235.3" width="70" height="97.7" fill="url(#ps-scan)" />
          </g>

          <circle
            className="ps-score"
            cx="439.4"
            cy="289.4"
            r="33.4"
            fill="none"
            stroke="#FC734D"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="96 100"
            transform="rotate(-90 439.4 289.4)"
          />

          <path
            className="ps-trace"
            d={SPEED_TRACE}
            fill="none"
            stroke="#FC734D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray="14 100"
            strokeDashoffset="14"
            opacity="0"
          />

          <circle className="brg-ring" cx="492.3" cy="369.7" r="6.6" fill="none" stroke="#38b6ff" strokeWidth="1.2" />
        </svg>
      </div>
    </figure>
  );
}

export function HostingManagementArtwork() {
  const rows = [
    {
      icon: Globe2,
      name: "Website hosting",
      detail: "Open your hosting tools",
      action: "Manage",
    },
    {
      icon: Mail,
      name: "Business email",
      detail: "Your team's email services",
      action: "View",
    },
    {
      icon: CreditCard,
      name: "Invoices & renewals",
      detail: "Keep track of upcoming payments",
      action: "Review",
    },
  ];
  return (
    <figure className="relative mx-auto w-full max-w-[560px] py-5">
      <div
        aria-hidden="true"
        className="absolute inset-x-5 top-0 h-28 rounded-t-[32px] bg-primary"
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-sm font-semibold text-foreground">
            Service overview
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            nPanel
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <LayoutDashboard size={21} />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Your business, connected.
              </p>
              <p className="text-xs text-muted-foreground">
                Services, billing and support in one place.
              </p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {rows.map(({ icon: Icon, name, detail, action }) => (
              <div key={name} className="flex items-center gap-3 py-4">
                <Icon size={20} className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {action}
                  <ArrowUpRight size={13} />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-orange/15 px-4 py-3">
            <LifeBuoy size={21} className="shrink-0 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                A team behind your services
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Get help with setup and the next step.
              </p>
            </div>
            <Check size={16} className="ml-auto shrink-0 text-foreground" />
          </div>
        </div>
      </div>
    </figure>
  );
}
