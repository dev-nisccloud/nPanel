export type BuiltDifferentPoint = {
  title: string;
  desc: string;
  /** Pin a specific visual when auto-detect would collide or feel generic. */
  visual?: VisualTheme;
};

/** Themes map one-to-one with a unique, message-relevant visual. */
export type VisualTheme =
  | "uptime"
  | "speed"
  | "security"
  | "migration"
  | "trust"
  | "pricing"
  | "growth"
  | "support"
  | "deploy"
  | "reporting"
  | "results"
  | "brand"
  | "clarity"
  | "inbox"
  | "localMarket"
  | "strategy"
  | "assets"
  | "craft"
  | "process"
  | "ownership"
  | "engagement"
  | "approval"
  | "targeting"
  | "tracking"
  | "creative"
  | "mobile"
  | "inventory"
  | "payment"
  | "automation"
  | "segments"
  | "typing"
  | "bot"
  | "integrate"
  | "code"
  | "funnel"
  | "calendar"
  | "algorithm"
  | "ethical"
  | "maps"
  | "default";

const FALLBACK_ORDER: VisualTheme[] = [
  "clarity",
  "process",
  "strategy",
  "craft",
  "assets",
  "ownership",
  "engagement",
  "approval",
  "targeting",
  "tracking",
  "creative",
  "mobile",
  "funnel",
  "calendar",
  "algorithm",
  "ethical",
  "maps",
  "localMarket",
  "bot",
  "integrate",
  "code",
  "segments",
  "typing",
  "automation",
  "inventory",
  "payment",
  "growth",
  "reporting",
  "results",
  "speed",
  "support",
  "deploy",
  "pricing",
  "brand",
  "inbox",
  "security",
  "migration",
  "uptime",
  "trust",
  "default",
];

export function detectVisualTheme(point: BuiltDifferentPoint): VisualTheme {
  if (point.visual) return point.visual;

  const text = `${point.title} ${point.desc}`.toLowerCase();

  if (/you own|intellectual property|source files|ownership/.test(text)) return "ownership";
  if (/colour psychology|color psychology|local culture|kenyan audience|local market/.test(text)) {
    return "localMarket";
  }
  if (/strategy before|research, not|rooted in research|design decision/.test(text)) return "strategy";
  if (/files, guidelines|templates|asset pack|business assets|print materials/.test(text)) {
    return "assets";
  }
  if (/experienced designer|brand designer|craft|designers/.test(text)) return "craft";
  if (/clear process|turnaround|tight process|delivery date/.test(text)) return "process";

  if (/engagement|comment|share|dm|community/.test(text)) return "engagement";
  if (/approv|before publishing|brand safety|review/.test(text)) return "approval";
  if (/content calendar|scheduling|handle everything|strategy, design, copy/.test(text)) {
    return "calendar";
  }
  if (/algorithm|instagram|tiktok|linkedin|facebook|reach/.test(text)) return "algorithm";
  if (/account manager|dedicated .* manager/.test(text)) return "support";

  if (/no wasted|targeting|impressions|audience/.test(text)) return "targeting";
  if (/conversion tracking|pixel|tag manager|attributed/.test(text)) return "tracking";
  if (/creative that|testimonial ads|direct-response|a\/b/.test(text)) return "creative";
  if (/management fee|ad spend|markups/.test(text)) return "pricing";
  if (/kpi|accountable|cost per lead|measurable results/.test(text)) return "results";

  if (/checkout|mobile use|product pages|shop on mobile/.test(text)) return "mobile";
  if (/inventory|stock|overselling|restock/.test(text)) return "inventory";
  if (/your money|payments settle|m-pesa|mpesa|payment/.test(text)) return "payment";
  if (/catalogue|catalog|scales from small/.test(text)) return "growth";

  if (/we write your|subject line|copywriter|brand voice/.test(text)) return "typing";
  if (/segmentation|segment by/.test(text)) return "segments";
  if (/automation running|welcome sequence|automated/.test(text)) return "automation";
  if (/spam|malware|filter|dkim|spf|dmarc|deliverability|reach inbox|junk folder/.test(text)) {
    return "inbox";
  }

  if (/never lose a lead|responds first|slow response/.test(text)) return "speed";
  if (/faq bot|qualifies leads|sales and support helper|ai understands|chatbot/.test(text)) {
    return "bot";
  }
  if (/integrates with|existing tools|zapier|hubspot|google calendar/.test(text)) {
    return "integrate";
  }
  if (/cost-effective|fraction of that cost/.test(text)) return "pricing";
  if (/stays human|human touch|high-value relationships/.test(text)) return "support";

  if (/no page builders|professionally coded|wix|squarespace/.test(text)) return "code";
  if (/conversion architecture|customer journey|turning more visitors/.test(text)) return "funnel";
  if (/seo-ready|seo \+|aeo|local search|get found|maps/.test(text)) {
    if (/maps|google, maps|local search/.test(text)) return "maps";
    return "growth";
  }
  if (/black-hat|keyword stuffing|ethical|no spam links/.test(text)) return "ethical";

  if (
    /m-pesa|stk|paying is simple|clear pricing|no .*fee|hidden cost|transparent fixed|affordable|live price|fixed project price/.test(
      text,
    )
  ) {
    return "pricing";
  }

  if (/99\.?9|uptime|sla|always online|systems operational/.test(text)) return "uptime";
  if (/migrat|transfer|move|zero downtime|from another/.test(text)) return "migration";
  if (/report|analytics|dashboard|transparent monthly|keyword position|every month you get/.test(text)) {
    return "reporting";
  }
  if (/30.?day results|results promise|measurable progress|visible progress within/.test(text)) {
    return "results";
  }
  if (/100\+|trusted by|clients we support|businesses growing|customers we/.test(text)) {
    return "trust";
  }
  if (/brand|logo|identity|visual identity|guidelines/.test(text)) return "brand";
  if (/ssl|encrypt|padlock|certificate|https|protects? your|not secure|secure checkout/.test(text)) {
    return "security";
  }
  if (
    /support|24\/7|chat|whatsapp|english and swahili|help for free|post-launch support|real .* help|training/.test(
      text,
    )
  ) {
    return "support";
  }
  if (
    /deploy|vps|bare metal|docker|provision|go live|managed so|updates, backups|automatic|one click/.test(
      text,
    )
  ) {
    return "deploy";
  }
  if (
    /clear name|easy to buy|without the confusion|one bill|one team|one plan|credibility|professional/.test(
      text,
    )
  ) {
    return "clarity";
  }
  if (/fast|speed|second|gbps|nvme|load|wherever they are|latency|turnaround/.test(text)) {
    return "speed";
  }
  if (/visitor|\.co\.ke|scales as|room to grow|busy days|traffic spikes|rank|google|traffic|conversion/.test(text)) {
    return "growth";
  }

  return "default";
}

/** Ensure every card in a section gets a distinct visual. */
export function assignUniqueThemes(points: BuiltDifferentPoint[]): VisualTheme[] {
  const used = new Set<VisualTheme>();

  return points.map((point) => {
    const preferred = detectVisualTheme(point);
    if (!used.has(preferred)) {
      used.add(preferred);
      return preferred;
    }

    for (const alt of FALLBACK_ORDER) {
      if (!used.has(alt)) {
        used.add(alt);
        return alt;
      }
    }

    return preferred;
  });
}

export function extractStat(text: string): string | null {
  const match = text.match(
    /(\d[\d.,]*(?:%|\+)?|\d+\s*(?:min|sec|ms|Gbps|TB|GB|MB|KES|days?)?)/i,
  );
  return match?.[1]?.trim() ?? null;
}
