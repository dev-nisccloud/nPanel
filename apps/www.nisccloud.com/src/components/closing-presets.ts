import type { ClosingVariant } from "./closing-visuals.tsx";

export type ClosingLayout = "split" | "reverse" | "centered";

export type ClosingTheme = {
  /** Banner background; fixed in both colour modes so each page keeps its identity. */
  surface: string;
  tone: "light" | "dark";
  /** Eyebrow dot colour. */
  dot: string;
  primaryButton: string;
  secondaryButton: string;
  /** Decorative texture laid over the surface. */
  pattern: string;
  layout: ClosingLayout;
};

const LIGHT_SECONDARY =
  "border border-[#02070a]/20 bg-white/40 text-[#02070a] hover:bg-white/70 focus-visible:ring-[#02070a]";
const DARK_SECONDARY = "border border-white/25 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white";
const DOTS = "bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255_/_0.35)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent_70%)]";
const GRID = "bg-[linear-gradient(rgb(255_255_255_/_0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.06)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]";
const LINES = "bg-[repeating-linear-gradient(135deg,rgb(2_7_10_/_0.05)_0_1px,transparent_1px_14px)]";

export const CLOSING_THEMES = {
  sky: {
    surface: "bg-[linear-gradient(120deg,#5cc4ff_0%,#38b6ff_45%,#1592e0_100%)]",
    tone: "light",
    dot: "bg-brand-orange",
    primaryButton: "bg-[#02070a] text-white hover:bg-[#02070a]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: DOTS,
    layout: "split",
  },
  cyan: {
    surface: "bg-[linear-gradient(115deg,#38b6ff_0%,#74ccff_55%,#38b6ff_100%)]",
    tone: "light",
    dot: "bg-[#02070a]",
    primaryButton: "bg-[#02070a] text-white hover:bg-[#02070a]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: DOTS,
    layout: "split",
  },
  indigo: {
    surface: "bg-[radial-gradient(ellipse_at_top_left,rgba(56,182,255,0.45)_0%,#02070a_70%)]",
    tone: "dark",
    dot: "bg-[#38b6ff]",
    primaryButton: "bg-white text-[#02070a] hover:bg-[#38b6ff]/10",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "centered",
  },
  sand: {
    surface: "bg-[linear-gradient(135deg,#fdf6e9_0%,#f8e7c8_60%,#f2d6a2_100%)]",
    tone: "light",
    dot: "bg-amber-600",
    primaryButton: "bg-amber-900 text-amber-50 hover:bg-amber-800",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "reverse",
  },
  midnightTeal: {
    surface: "bg-[radial-gradient(ellipse_at_bottom_right,#0f766e_0%,#042f2e_45%,#02070a_100%)]",
    tone: "dark",
    dot: "bg-teal-300",
    primaryButton: "bg-teal-300 text-[#02070a] hover:bg-teal-200",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "split",
  },
  graphite: {
    surface: "bg-[linear-gradient(135deg,#3f3f46_0%,#27272a_50%,#18181b_100%)]",
    tone: "dark",
    dot: "bg-zinc-300",
    primaryButton: "bg-white text-zinc-900 hover:bg-zinc-100",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "reverse",
  },
  slateBlue: {
    surface: "bg-[linear-gradient(135deg,#1e3a5f_0%,#172554_60%,#0b1430_100%)]",
    tone: "dark",
    dot: "bg-[#38b6ff]",
    primaryButton: "bg-[#38b6ff] text-[#02070a] hover:bg-[#38b6ff]/85",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "split",
  },
  skyLight: {
    surface: "bg-[linear-gradient(180deg,#f0f9ff_0%,#e0f2fe_100%)] ring-1 ring-[#38b6ff]/20",
    tone: "light",
    dot: "bg-[#38b6ff]",
    primaryButton: "bg-[#38b6ff] text-[#02070a] hover:bg-[#38b6ff]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "centered",
  },
  mint: {
    surface: "bg-[linear-gradient(120deg,#d1fae5_0%,#a7f3d0_60%,#6ee7b7_100%)]",
    tone: "light",
    dot: "bg-emerald-700",
    primaryButton: "bg-emerald-900 text-white hover:bg-emerald-800",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "split",
  },
  emerald: {
    surface: "bg-[radial-gradient(ellipse_at_top_right,#047857_0%,#064e3b_50%,#022c22_100%)]",
    tone: "dark",
    dot: "bg-emerald-300",
    primaryButton: "bg-emerald-300 text-emerald-950 hover:bg-emerald-200",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "reverse",
  },
  violet: {
    surface: "bg-[linear-gradient(125deg,#7c3aed_0%,#5b21b6_55%,#3b0764_100%)]",
    tone: "dark",
    dot: "bg-violet-200",
    primaryButton: "bg-white text-violet-950 hover:bg-violet-50",
    secondaryButton: DARK_SECONDARY,
    pattern: DOTS,
    layout: "split",
  },
  amber: {
    surface: "bg-[linear-gradient(120deg,#fde68a_0%,#fbbf24_60%,#f59e0b_100%)]",
    tone: "light",
    dot: "bg-[#02070a]",
    primaryButton: "bg-[#02070a] text-white hover:bg-[#02070a]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "reverse",
  },
  coral: {
    surface: "bg-[linear-gradient(135deg,#fff1ec_0%,#ffd8cc_55%,#ffb8a3_100%)]",
    tone: "light",
    dot: "bg-rose-600",
    primaryButton: "bg-rose-700 text-white hover:bg-rose-800",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "split",
  },
  ink: {
    surface: "bg-[#0b0b0f] ring-1 ring-white/10",
    tone: "dark",
    dot: "bg-brand-orange",
    primaryButton: "bg-brand-orange text-[#0b0b0f] hover:brightness-110",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "reverse",
  },
  lime: {
    surface: "bg-[radial-gradient(ellipse_at_top_left,#365314_0%,#1a2e05_50%,#0a1402_100%)]",
    tone: "dark",
    dot: "bg-lime-300",
    primaryButton: "bg-lime-300 text-lime-950 hover:bg-lime-200",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "split",
  },
  rose: {
    surface: "bg-[linear-gradient(125deg,#be185d_0%,#9d174d_55%,#500724_100%)]",
    tone: "dark",
    dot: "bg-pink-200",
    primaryButton: "bg-white text-pink-950 hover:bg-pink-50",
    secondaryButton: DARK_SECONDARY,
    pattern: DOTS,
    layout: "reverse",
  },
  orange: {
    surface: "bg-[linear-gradient(120deg,#fed7aa_0%,#fdba74_55%,#fb923c_100%)]",
    tone: "light",
    dot: "bg-[#02070a]",
    primaryButton: "bg-[#02070a] text-white hover:bg-[#02070a]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: DOTS,
    layout: "split",
  },
  aurora: {
    surface: "bg-[linear-gradient(120deg,#38b6ff_0%,#38b6ff_45%,#a855f7_80%,#ec4899_100%)]",
    tone: "dark",
    dot: "bg-white",
    primaryButton: "bg-white text-[#02070a] hover:bg-white/90",
    secondaryButton: DARK_SECONDARY,
    pattern: DOTS,
    layout: "split",
  },
  azure: {
    surface: "bg-[linear-gradient(120deg,#e6f6ff_0%,#b3e3ff_60%,#38b6ff_100%)]",
    tone: "light",
    dot: "bg-[#38b6ff]",
    primaryButton: "bg-[#38b6ff] text-[#02070a] hover:bg-[#38b6ff]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "reverse",
  },
  sunrise: {
    surface: "bg-[linear-gradient(120deg,#fef3c7_0%,#fde2e4_55%,#e0e7ff_100%)]",
    tone: "light",
    dot: "bg-red-500",
    primaryButton: "bg-[#02070a] text-white hover:bg-[#02070a]/85",
    secondaryButton: LIGHT_SECONDARY,
    pattern: LINES,
    layout: "centered",
  },
  plum: {
    surface: "bg-[radial-gradient(ellipse_at_bottom_left,#86198f_0%,#4a044e_55%,#1f0122_100%)]",
    tone: "dark",
    dot: "bg-fuchsia-200",
    primaryButton: "bg-fuchsia-200 text-fuchsia-950 hover:bg-fuchsia-100",
    secondaryButton: DARK_SECONDARY,
    pattern: GRID,
    layout: "split",
  },
} satisfies Record<string, ClosingTheme>;

export type ClosingThemeName = keyof typeof CLOSING_THEMES;

export type ClosingPreset = {
  theme: ClosingThemeName;
  eyebrow: string;
  points: string[];
  primaryLabel?: string;
  secondary?: { label: string; href: string };
  card: {
    variant: ClosingVariant;
    items?: string[];
    rows?: { label: string; value: string }[];
    command?: string;
    title?: string;
  };
};

/** Page-specific closing banners, keyed by route. Points must stay verified facts. */
export const CLOSING_PRESETS: Record<string, ClosingPreset> = {
  "/hosting/web-hosting": {
    theme: "cyan",
    eyebrow: "Your site, live this week",
    points: ["Email hosting included", "Free SSL and daily backups"],
    primaryLabel: "Choose a plan",
    secondary: { label: "Talk to sales", href: "/contact?serviceName=Web%20Hosting" },
    card: { variant: "storefront" },
  },
  "/hosting/wordpress": {
    theme: "indigo",
    eyebrow: "WordPress, handled",
    points: ["Automatic WordPress updates", "Daily backups on every plan"],
    primaryLabel: "Start your WordPress site",
    secondary: { label: "Migrate my site free", href: "/hosting/transfer" },
    card: { variant: "staging" },
  },
  "/hosting/email": {
    theme: "sand",
    eyebrow: "Look the part in every inbox",
    points: ["Email on your own domain", "Works on phone and desktop"],
    primaryLabel: "Get business email",
    secondary: { label: "Compare plans", href: "#plans" },
    card: { variant: "inbox" },
  },
  "/hosting/hybrid-email": {
    theme: "azure",
    eyebrow: "Mix mailboxes, pay for what you use",
    points: ["Mix mailbox types on one domain", "Managed from nPanel"],
    secondary: { label: "Talk to our team", href: "/contact?serviceName=Hybrid%20Email" },
    card: { variant: "inbox", items: ["accounts@yourbusiness.co.ke"] },
  },
  "/hosting/microsoft-365": {
    theme: "azure",
    eyebrow: "Office apps on your domain",
    points: ["Outlook, Teams and OneDrive", "Setup help on your domain"],
    secondary: { label: "Talk to our team", href: "/contact?serviceName=Microsoft%20365" },
    card: { variant: "brief", items: ["Number of users", "Your domain", "Current email provider"] },
  },
  "/hosting/google-workspace": {
    theme: "sunrise",
    eyebrow: "Gmail with your name on it",
    points: ["Gmail, Drive and Meet", "Setup help on your domain"],
    secondary: { label: "Talk to our team", href: "/contact?serviceName=Google%20Workspace" },
    card: { variant: "brief", items: ["Number of users", "Your domain", "Data to move across"] },
  },
  "/hosting/vps": {
    theme: "midnightTeal",
    eyebrow: "Root access, your rules",
    points: ["Full root access", "Managed from nPanel"],
    primaryLabel: "Deploy a server",
    secondary: { label: "Help me size it", href: "/contact?serviceName=VPS%20Hosting" },
    card: { variant: "rack" },
  },
  "/hosting/vds": {
    theme: "slateBlue",
    eyebrow: "Dedicated resources, cloud flexibility",
    points: ["Resources reserved for you", "Managed from nPanel"],
    secondary: { label: "Help me size it", href: "/contact?serviceName=VDS%20Hosting" },
    card: {
      variant: "command",
      title: "Your VDS",
      command: "cores held for this server",
      items: ["Dedicated vCPU on every size", "10TB on a 1Gbps port"],
    },
  },
  "/hosting/dedicated-servers": {
    theme: "graphite",
    eyebrow: "A whole machine, just for you",
    points: ["No shared hardware", "Sized to your workload"],
    primaryLabel: "Request a server",
    secondary: { label: "Talk to an engineer", href: "/contact?serviceName=Dedicated%20Servers" },
    card: {
      variant: "spec",
      rows: [
        { label: "Processor", value: "Chosen to fit" },
        { label: "Memory", value: "Sized to fit" },
        { label: "Storage", value: "Sized to fit" },
        { label: "Network", value: "Shown per machine" },
      ],
    },
  },
  "/hosting/domains": {
    theme: "skyLight",
    eyebrow: "Claim your name before someone else does",
    points: [".co.ke, .com and more", "Manage DNS in nPanel"],
    primaryLabel: "Search domains",
    card: { variant: "domains", items: ["yourbusiness.co.ke", "yourbusiness.com", "yourbusiness.org"] },
  },
  "/domain-transfer": {
    theme: "mint",
    eyebrow: "Bring your domain home",
    points: ["Guided step by step", "Managed in nPanel afterwards"],
    secondary: { label: "Check eligibility", href: "#eligibility" },
    card: { variant: "timeline", items: ["Unlock at your current registrar", "Get the transfer code", "Approve the transfer", "Manage it in nPanel"] },
  },
  "/hosting/ssl": {
    theme: "emerald",
    eyebrow: "Show the padlock, earn the trust",
    points: ["Free installation", "Trusted by major browsers"],
    primaryLabel: "Secure my site",
    secondary: { label: "Help me choose", href: "/contact?serviceName=SSL%20Certificates" },
    card: { variant: "shield", items: ["Certificate issued", "Installed on your site", "HTTPS enforced", "Managed in nPanel"] },
  },
  "/hosting/agency": {
    theme: "violet",
    eyebrow: "Built for agencies and freelancers",
    points: ["Every client site in one panel", "Plans for growing client lists"],
    primaryLabel: "Book an agency call",
    card: { variant: "sites", items: ["client-one.co.ke", "client-two.com", "shop-three.co.ke", "studio-four.com"] },
  },
  "/hosting/transfer": {
    theme: "amber",
    eyebrow: "Switching is easier than you think",
    points: ["We plan the move with you", "Pay with M-Pesa or card"],
    primaryLabel: "Request migration",
    card: { variant: "brief", items: ["Your current host", "Sites and mailboxes to move", "Preferred switch-over time"] },
  },
  "/services/website-design": {
    theme: "coral",
    eyebrow: "A website that sells for you",
    points: ["Designed for your customers", "Hosting and domain sorted too"],
    primaryLabel: "Start a project",
    secondary: { label: "See our work", href: "/work" },
    card: { variant: "brief", items: ["What your business does", "Pages and features you need", "Launch date and budget"] },
  },
  "/services/ecommerce": {
    theme: "orange",
    eyebrow: "Open your online shop",
    points: ["Products you can update yourself", "Training for your team"],
    primaryLabel: "Plan my shop",
    secondary: { label: "See our work", href: "/work" },
    card: { variant: "storefront" },
  },
  "/services/brand-identity": {
    theme: "ink",
    eyebrow: "Be remembered",
    points: ["Strategy before design", "A full brand kit you own"],
    primaryLabel: "Book a brand session",
    secondary: { label: "See our work", href: "/work" },
    card: { variant: "brand" },
  },
  "/services/seo": {
    theme: "lime",
    eyebrow: "Get found by the right people",
    points: ["Monthly rank tracking", "Clear reporting"],
    primaryLabel: "Get a growth plan",
    card: { variant: "timeline", items: ["Site and keyword audit", "Fixes and content plan", "Monthly progress report", "Next priorities agreed"] },
  },
  "/services/paid-ads": {
    theme: "rose",
    eyebrow: "Spend less per customer",
    points: ["Campaigns built around your goals", "Clear reporting"],
    primaryLabel: "Plan my campaign",
    card: { variant: "timeline", items: ["Goals and budget set", "Ads and tracking built", "Weekly optimisation", "Results reported"] },
  },
  "/services/social-media": {
    theme: "plum",
    eyebrow: "Show up every week",
    points: ["Content calendar you approve", "Monthly performance report"],
    primaryLabel: "Plan my content",
    card: { variant: "timeline", items: ["Brand voice agreed", "Monthly calendar approved", "Posts published", "What worked, reported"] },
  },
  "/services/email-marketing": {
    theme: "sunrise",
    eyebrow: "Turn subscribers into customers",
    points: ["Campaigns and automations", "Open and click reporting"],
    primaryLabel: "Plan my emails",
    card: { variant: "inbox", items: ["news@yourbusiness.co.ke"] },
  },
  "/services/zepo-ai": {
    theme: "aurora",
    eyebrow: "Put AI to work in your business",
    points: ["Built around your workflows", "Set up with your team"],
    primaryLabel: "Try Zepo AI",
    card: {
      variant: "command",
      title: "Zepo AI",
      command: "summarise today's customer enquiries",
      items: ["Enquiries grouped by topic", "Replies drafted for your review"],
    },
  },
};
