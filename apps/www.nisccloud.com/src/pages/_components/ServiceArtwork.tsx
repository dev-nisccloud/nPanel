import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Globe,
  Server,
  Mail,
  Paintbrush,
  Search,
  Sparkles,
  Check,
  ArrowUpRight,
  MonitorSmartphone,
  Megaphone,
  Pause,
  Play,
  FileText,
  ShieldCheck,
} from "lucide-react";

export type ArtworkKind =
  | "domains"
  | "hosting"
  | "email"
  | "brand"
  | "search"
  | "marketing"
  | "ai"
  | "web";
const scenes = {
  domains: {
    title: "A name that belongs to you.",
    label: "Domains",
    icon: Globe,
    subtitle: "Your business starts with your address.",
    rows: ["yourcompany.co.ke", "yourcompany.com", "yourcompany.africa"],
    status: "Find your domain",
    detail: "Search. Register. Connect.",
  },
  hosting: {
    title: "Your next chapter. Online.",
    label: "Web hosting",
    icon: Server,
    subtitle: "A connected home for your website and business.",
    rows: [
      "Website & WordPress",
      "Cloud servers & resources",
      "Backups & monitoring",
    ],
    status: "Built to keep you moving",
    detail: "Hosting that grows with your work.",
  },
  email: {
    title: "Your name. Your business email.",
    label: "Nisc Mail",
    icon: Mail,
    subtitle: "Professional conversations on your own domain.",
    rows: [
      "hello@yourcompany.com",
      "sales@yourcompany.com",
      "team@yourcompany.com",
    ],
    status: "Protected business email",
    detail: "Nisc Mail + your choice of cloud suite.",
  },
  brand: {
    title: "Make every impression yours.",
    label: "Brand kit",
    icon: Paintbrush,
    subtitle: "One identity. Every customer touchpoint.",
    rows: [
      "Logo & brand guidelines",
      "Business cards & letterheads",
      "Company profile & signatures",
    ],
    status: "Created around your business",
    detail: "From the first sketch to your full brand kit.",
  },
  search: {
    title: "Be found. Be understood.",
    label: "SEO / AEO / GEO",
    icon: Search,
    subtitle: "Help customers discover what makes you the right fit.",
    rows: [
      "Search engine visibility",
      "Answers to customer questions",
      "Your business in AI discovery",
    ],
    status: "One connected search strategy",
    detail: "Useful content. Clear evidence. Measurable progress.",
  },
  marketing: {
    title: "Turn attention into opportunity.",
    label: "Marketing & growth",
    icon: Megaphone,
    subtitle: "Connect your message, your audience and your next campaign.",
    rows: [
      "Strategy & content creation",
      "Campaigns & paid media",
      "SEO, email & social media",
    ],
    status: "From first impression to enquiry",
    detail: "Plan. Create. Reach. Measure.",
  },
  ai: {
    title: "More time for your next idea.",
    label: "Zepo AI",
    icon: Sparkles,
    subtitle: "Put useful AI to work in your everyday workflows.",
    rows: [
      "Create content & campaign ideas",
      "Build email with AI assistance",
      "Support replies & follow-ups",
    ],
    status: "AI tools. Human expertise.",
    detail: "Your team stays in control.",
  },
  web: {
    title: "Make your next idea work.",
    label: "Websites & applications",
    icon: MonitorSmartphone,
    subtitle: "Designed around what your customers need to do.",
    rows: [
      "Website & online store",
      "Web & mobile applications",
      "Briefs, feedback & delivery",
    ],
    status: "From brief to launch",
    detail: "A clear journey from idea to delivery.",
  },
};

export function artworkForService(label: string): ArtworkKind {
  if (/domain/i.test(label)) return "domains";
  if (/email|mail/i.test(label)) return "email";
  if (/brand|logo|creative/i.test(label)) return "brand";
  if (/seo|aeo|geo|search/i.test(label)) return "search";
  if (/zeepo|automation|\bai\b/i.test(label)) return "ai";
  if (/design|commerce|application|development/i.test(label)) return "web";
  if (/marketing|social|advert|paid|media/i.test(label)) return "marketing";
  return "hosting";
}

export function ServiceArtwork({
  kind,
  compact = false,
}: {
  kind: ArtworkKind;
  compact?: boolean;
}) {
  const scene = scenes[kind];
  const Icon = scene.icon;
  return (
    <div
      role="img"
      aria-label={`${scene.label}: ${scene.subtitle} ${scene.rows.join(", ")}`}
      className={`relative isolate w-full overflow-hidden rounded-2xl border border-border bg-primary/5 ${compact ? "p-4" : "p-5 sm:p-8"}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-56 rounded-full border-[32px] border-primary/10"
      />
      <div className="relative mb-6 flex items-center justify-between gap-3">
        <img src="/nisccloud-logo.svg" alt="" className="h-7 max-w-[142px]" />
        <span className="rounded-full border border-primary/20 bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground sm:text-xs">
          {scene.label}
        </span>
      </div>
      <div className="relative ml-2 rounded-2xl border border-border bg-card p-5 shadow-sm sm:ml-6 sm:p-7">
        <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="size-1.5 rounded-full bg-primary/40" />
          <span className="size-1.5 rounded-full bg-primary/20" />
        </div>
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={26} strokeWidth={1.5} />
        </div>
        <p className="max-w-[330px] text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          {scene.title}
        </p>
        <p className="mt-3 max-w-[330px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {scene.subtitle}
        </p>
        {kind === "brand" && (
          <div className="mt-5 flex gap-2" aria-hidden="true">
            <span className="h-7 flex-1 rounded bg-primary" />
            <span className="h-7 flex-1 rounded bg-foreground" />
            <span className="h-7 flex-1 rounded border border-border bg-background" />
          </div>
        )}
        <div className="mt-6 space-y-2">
          {scene.rows.map((row, i) => (
            <div
              key={row}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs text-foreground sm:text-sm"
            >
              <span className="text-primary">
                {kind === "email" ? (
                  <Mail size={15} />
                ) : kind === "brand" ? (
                  <FileText size={15} />
                ) : (
                  <Check size={15} />
                )}
              </span>
              <span className="min-w-0 flex-1 break-words">{row}</span>
              <ArrowUpRight
                size={13}
                className="shrink-0 text-muted-foreground"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative -mt-3 mr-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-background p-3 shadow-sm sm:mr-16 sm:p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {kind === "email" ? <ShieldCheck size={18} /> : <Check size={18} />}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground sm:text-sm">
            {scene.status}
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
            {scene.detail}
          </p>
        </div>
      </div>
      <p className="relative mt-4 text-right text-[10px] text-muted-foreground">
        Service illustration
      </p>
    </div>
  );
}

const reel: ArtworkKind[] = [
  "domains",
  "hosting",
  "email",
  "brand",
  "search",
  "marketing",
];
export function NiscServiceReel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % reel.length),
      6500,
    );
    return () => clearInterval(timer);
  }, [paused, reducedMotion]);
  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={reel[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <ServiceArtwork kind={reel[index]} />
        </motion.div>
      </AnimatePresence>
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
        aria-label="Explore Nisc services"
      >
        {reel.map((kind, i) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setIndex(i);
              setPaused(true);
            }}
            aria-pressed={index === i}
            className={`rounded-lg px-2 py-2 text-[11px] transition-colors ${index === i ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {scenes[kind].label}
          </button>
        ))}
        <button
          type="button"
          aria-label={
            paused ? "Play service animation" : "Pause service animation"
          }
          onClick={() => setPaused((value) => !value)}
          className="rounded-lg border border-border p-2 text-muted-foreground"
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}
