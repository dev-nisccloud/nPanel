import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  AtSign,
  Bot,
  Globe,
  HardDrive,
  Mail,
  Megaphone,
  Search,
  Server,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/*
 * Three pillar illustrations, each with its own composition:
 *  Build – stacked design layers (wireframe → colour → finished page), orange accent.
 *  Run   – orbit of live services around an online domain, sky accent.
 *  Grow  – midnight chart with a rising sky curve and an orange goal marker.
 * All data is fictional. Motion runs only with no reduced-motion preference and while the card is on screen.
 */

const SKY = "#38b6ff";
const ORANGE = "#fc734d";

type Vars = React.CSSProperties & Record<`--${string}`, string>;

/** Build: the wireframe drafts, colour and the finished page slide in, then the page is published and goes live. */
function BuildVisual() {
  const burst = [
    { x: -16, y: -14, fill: ORANGE },
    { x: 14, y: -16, fill: SKY },
    { x: 22, y: 4, fill: ORANGE },
    { x: -20, y: 6, fill: SKY },
  ];
  return (
    <svg
      viewBox="0 0 260 150"
      role="img"
      aria-label="Three stacked design layers: a wireframe, a colour and type layer, and the finished page ready to publish"
      className="h-full w-full max-w-[260px] overflow-visible"
    >
      <defs>
        <linearGradient id="brg-build-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SKY} stopOpacity="0.55" />
          <stop offset="1" stopColor={SKY} stopOpacity="0.12" />
        </linearGradient>
        <filter id="brg-build-shadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#02070a" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* back layer: wireframe, its outline drafting continuously */}
      <g transform="translate(92 8) skewX(-16)">
        <rect
          width="138"
          height="86"
          rx="8"
          className="fill-card stroke-border art-dash"
          strokeWidth="1.25"
          strokeDasharray="4 3"
        />
        <rect x="12" y="12" width="46" height="6" rx="2" className="fill-muted" />
        <rect x="12" y="24" width="114" height="22" rx="3" className="fill-muted" />
        <rect x="12" y="52" width="34" height="20" rx="3" className="fill-muted" />
        <rect x="52" y="52" width="34" height="20" rx="3" className="fill-muted" />
        <rect x="92" y="52" width="34" height="20" rx="3" className="fill-muted" />
      </g>

      {/* middle layer: colour and type */}
      <g transform="translate(62 32) skewX(-16)" filter="url(#brg-build-shadow)">
        <g className="brg-layer-mid">
          <rect width="138" height="86" rx="8" className="fill-card stroke-border" strokeWidth="1.25" />
          <rect x="12" y="12" width="18" height="18" rx="4" fill={SKY} />
          <rect x="34" y="12" width="18" height="18" rx="4" fill={ORANGE} />
          <rect x="56" y="12" width="18" height="18" rx="4" fill="#02070a" />
          <rect x="12" y="40" width="80" height="7" rx="2" className="fill-foreground/80" />
          <rect x="12" y="52" width="110" height="4" rx="2" className="fill-muted-foreground/50" />
          <rect x="12" y="60" width="96" height="4" rx="2" className="fill-muted-foreground/50" />
          <rect x="12" y="68" width="70" height="4" rx="2" className="fill-muted-foreground/50" />
        </g>
      </g>

      {/* front layer: finished page, assembling block by block */}
      <g transform="translate(30 56) skewX(-16)" filter="url(#brg-build-shadow)">
        <g className="brg-layer-front">
          <rect width="138" height="86" rx="8" className="fill-card stroke-border" strokeWidth="1.25" />
          <rect x="10" y="9" width="118" height="34" rx="5" fill="url(#brg-build-hero)" className="brg-fill-x" />
          <circle cx="22" cy="20" r="5" fill="#02070a" />
          <rect x="31" y="17" width="26" height="5" rx="2" className="fill-foreground/80" />
          <rect x="18" y="31" width="60" height="4" rx="2" className="fill-foreground/60" />
          <rect x="10" y="50" width="38" height="26" rx="4" className="brg-pop fill-muted" />
          <rect x="52" y="50" width="38" height="26" rx="4" className="brg-pop fill-muted" style={{ animationDelay: "0.12s" }} />
          <rect x="94" y="50" width="34" height="26" rx="4" fill={ORANGE} fillOpacity="0.9" className="brg-pop" style={{ animationDelay: "0.24s" }} />
        </g>
      </g>

      {/* publish tag, which flips to Live once clicked */}
      <g transform="translate(148 124)">
        <g className="brg-publish">
          <rect width="70" height="20" rx="10" fill="#02070a" />
          <circle cx="12" cy="10" r="3" fill={ORANGE} />
          <text x="21" y="13.5" fontSize="9.5" fontWeight="700" fill="#ffffff" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Publish
          </text>
        </g>
        <g className="brg-live" aria-hidden>
          <rect width="70" height="20" rx="10" fill={SKY} />
          <path d="M9 10.2 L12 13 L17 7.5" fill="none" stroke="#02070a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <text x="22" y="13.5" fontSize="9.5" fontWeight="700" fill="#02070a" fontFamily="ui-sans-serif, system-ui, sans-serif">
            Live
          </text>
        </g>
        {burst.map(({ x, y, fill }, i) => (
          <rect
            key={i}
            x="33"
            y="7"
            width="5"
            height="5"
            fill={fill}
            className="brg-burst"
            style={{ "--tx": `${x}px`, "--ty": `${y}px` } as Vars}
            aria-hidden
          />
        ))}
      </g>

      {/* cursor that travels to Publish and clicks */}
      <g className="brg-cursor" aria-hidden>
        <path
          d="M0 0 L0 12 L3.2 9 L5.8 14.2 L8 13.2 L5.4 8.2 L9.6 8.2 Z"
          fill="#ffffff"
          stroke="#02070a"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Run: the live domain at the centre, sending a steady signal to each service that keeps it running. */
function RunVisual() {
  const nodes = [
    { icon: Globe, label: "Domain", className: "left-[18.5%] top-[12%]", x: 50, y: 18, delay: "0s" },
    { icon: HardDrive, label: "Hosting", className: "left-[81.5%] top-[12%]", x: 220, y: 18, delay: "0.6s" },
    { icon: Mail, label: "Email", className: "left-[81.5%] top-[88%]", x: 220, y: 132, delay: "1.2s" },
    { icon: Server, label: "VPS", className: "left-[18.5%] top-[88%]", x: 50, y: 132, delay: "1.8s" },
  ];
  return (
    <div
      role="img"
      aria-label="A live domain at the centre with domain, hosting, email and server services in orbit around it"
      className="relative aspect-[270/150] w-full max-w-[270px]"
    >
      <svg viewBox="0 0 270 150" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <circle
          cx="135"
          cy="75"
          r="58"
          fill="none"
          stroke={SKY}
          strokeOpacity="0.45"
          strokeWidth="1.25"
          strokeDasharray="3 5"
          className="origin-center motion-safe:animate-[spin_40s_linear_infinite]"
        />
        <circle cx="135" cy="75" r="40" fill="none" className="stroke-border" strokeWidth="1" />
        {nodes.map(({ label, x, y }) => (
          <line
            key={label}
            x1="135"
            y1="75"
            x2={x}
            y2={y}
            stroke={SKY}
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}
        <circle cx="135" cy="75" r="24" fill={SKY} fillOpacity="0.12" />
        <circle
          cx="135"
          cy="75"
          r="24"
          fill="none"
          stroke={SKY}
          strokeOpacity="0.5"
          strokeWidth="1"
          className="origin-center motion-safe:animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
        />
        {nodes.map(({ label, x, y, delay }) => (
          <circle
            key={label}
            cx="135"
            cy="75"
            r="2.6"
            fill={SKY}
            opacity="0"
            className="brg-pulse"
            style={{ "--tx": `${(x - 135) * 0.8}px`, "--ty": `${(y - 75) * 0.8}px`, animationDelay: delay } as Vars}
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-md">
        <span className="font-mono text-[9px] font-semibold leading-none text-foreground">
          yourbusiness.co.ke
        </span>
        <span className="flex items-center gap-1 text-[8px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 art-signal" />
          Online
        </span>
      </div>

      {nodes.map(({ icon: Icon, label, className, delay }) => (
        <span
          key={label}
          className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-primary/30 bg-card px-2 py-1 text-[9px] font-semibold text-foreground shadow-sm ${className}`}
        >
          <Icon className="size-3 text-primary" aria-hidden />
          {label}
          <span className="brg-node size-1.5 rounded-full bg-primary" style={{ animationDelay: delay }} aria-hidden />
        </span>
      ))}
    </div>
  );
}

const GROW_PATH = "M0 62 C 40 60, 60 56, 90 46 S 150 28, 180 22 S 220 14, 236 12";

/** Grow: a midnight chart. A signal climbs the curve to the goal while each channel takes its turn. */
function GrowVisual({ animate }: { animate: boolean }) {
  const channels = [
    { icon: Search, label: "SEO" },
    { icon: Megaphone, label: "Paid" },
    { icon: Share2, label: "Social" },
    { icon: AtSign, label: "Email" },
  ];
  return (
    <div
      role="img"
      aria-label="A growth chart rising across SEO, paid media, social and email channels towards an agreed goal"
      className="w-full max-w-[260px] overflow-hidden rounded-2xl bg-[#02070a] p-3 text-white shadow-lg"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold">Growth plan</span>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: ORANGE }} />
          Goal
        </span>
      </div>

      <svg viewBox="0 0 236 70" className="mt-1.5 h-[70px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="brg-grow-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SKY} stopOpacity="0.45" />
            <stop offset="1" stopColor={SKY} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="brg-grow-glow">
            <stop offset="0" stopColor={SKY} stopOpacity="0.9" />
            <stop offset="1" stopColor={SKY} stopOpacity="0" />
          </radialGradient>
        </defs>
        {[14, 32, 50].map((y) => (
          <line key={y} x1="0" x2="236" y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.08" />
        ))}
        <line x1="0" x2="236" y1="10" y2="10" stroke={ORANGE} strokeOpacity="0.7" strokeDasharray="3 4" />
        <path d={`${GROW_PATH} L236 70 L0 70 Z`} fill="url(#brg-grow-fill)" />
        <path
          d={GROW_PATH}
          fill="none"
          stroke={SKY}
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="motion-safe:animate-[brg-grow-draw_1.6s_ease-out_both]"
        />
        {animate && (
          <g>
            <circle r="9" fill="url(#brg-grow-glow)">
              <animateMotion dur="4.8s" begin="1.6s" repeatCount="indefinite" path={GROW_PATH} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" />
            </circle>
            <circle r="2.6" fill="#ffffff">
              <animateMotion dur="4.8s" begin="1.6s" repeatCount="indefinite" path={GROW_PATH} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" />
            </circle>
          </g>
        )}
        <circle cx="236" cy="12" r="4" fill={ORANGE} />
        <circle cx="236" cy="12" r="7" fill="none" stroke={ORANGE} strokeOpacity="0.5" className="brg-ring" />
        <style>{`@keyframes brg-grow-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`}</style>
      </svg>

      <div className="mt-1 grid grid-cols-4 gap-1">
        {channels.map(({ icon: Icon, label }, i) => (
          <span
            key={label}
            className="brg-chip flex items-center justify-center gap-1 rounded-md bg-white/[0.07] py-1 text-[9px] font-medium text-white/85"
            style={{ animationDelay: `${i * 1.2}s` }}
          >
            <Icon className="size-2.5" style={{ color: SKY }} aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[9px] text-white/60">Goals agreed and reported</p>
    </div>
  );
}

/** Runs a pillar's artwork only while it is on screen; otherwise every animation is paused. */
function PillarVisual({ Visual }: { Visual: (props: { animate: boolean }) => React.ReactElement }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div ref={ref} className={`flex h-full w-full items-center justify-center ${inView ? "" : "brg-paused"}`}>
      <Visual animate={inView && !reduceMotion} />
    </div>
  );
}

const pillars = [
  {
    tag: "Build",
    title: "Make your ideas real.",
    body: "Build a strong brand, launch customer-ready websites and ecommerce experiences, and develop software tailored to the way you work.",
    items: ["Brand identity", "Websites", "Ecommerce", "Custom applications"],
    cta: { label: "Explore Build Solutions", href: "/services" },
    tint: "from-brand-orange/20 via-brand-orange/5",
    tagClass: "text-[#c2410c] dark:text-brand-orange",
    Visual: BuildVisual,
  },
  {
    tag: "Run",
    title: "Keep your digital business running.",
    body: "Operate with domains, hosting, business email, cloud infrastructure and security services managed around your business needs.",
    items: ["Domains", "Hosting", "Email", "VPS & servers"],
    cta: { label: "Explore Cloud Products", href: "/hosting" },
    tint: "from-primary/20 via-primary/5",
    tagClass: "text-primary",
    Visual: RunVisual,
  },
  {
    tag: "Grow",
    title: "Turn digital activity into measurable growth.",
    body: "Reach the right customers through SEO, advertising, content and connected customer engagement.",
    items: ["SEO", "Paid media", "Social & content", "Marketing automation"],
    cta: { label: "Explore Growth Services", href: "/services/marketing" },
    tint: "from-slate-900/15 via-slate-900/[0.04] dark:from-white/10 dark:via-white/[0.03]",
    tagClass: "text-foreground",
    Visual: GrowVisual,
  },
] as const;

/** Homepage Build / Run / Grow positioning with the Zepo AI layer. */
export default function BuildRunGrow() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="build-run-grow"
      aria-labelledby="brg-heading"
      className="py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 font-mono text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Build. Run. Grow.
          </p>
          <h2
            id="brg-heading"
            className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
          >
            One partner for every stage of your digital business.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map(
            ({ tag, title, body, items, cta, tint, tagClass, Visual }, i) => (
              <motion.article
                key={tag}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col rounded-3xl border border-border bg-card p-3"
              >
                <div
                  className={`flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} to-transparent p-5`}
                >
                  <PillarVisual Visual={Visual} />
                </div>
                <div className="flex flex-1 flex-col p-4 pt-5">
                  <p
                    className={`font-mono text-xs font-bold tracking-[0.2em] uppercase ${tagClass}`}
                  >
                    {tag}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                  <p className="mt-4 text-xs font-medium text-foreground/80">
                    {items.join(" · ")}
                  </p>
                  <Link
                    to={cta.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {cta.label}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </motion.article>
            ),
          )}
        </div>

        <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-brand-orange/30 bg-gradient-to-r from-brand-orange/10 via-primary/5 to-transparent p-6 md:flex-row md:items-center md:p-7">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/15 text-[#b9411f] dark:text-brand-orange">
            <Bot className="size-6" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#b9411f] uppercase dark:text-brand-orange">
              Zepo AI
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight md:text-xl">
              Smarter tools, built into the way you work.
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explore how Zepo AI can support customer conversations,
              follow-ups and repetitive workflows in the services where it is
              available.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 gap-2 rounded-full px-6 font-semibold"
          >
            <Link to="/services/zepo-ai">
              Explore Zepo AI
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
