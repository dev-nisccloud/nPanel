export type BuiltDifferentPoint = {
  title: string;
  desc: string;
};

export type VisualTheme =
  | "uptime"
  | "speed"
  | "mpesa"
  | "security"
  | "migration"
  | "trust"
  | "pricing"
  | "location"
  | "growth"
  | "support"
  | "deploy"
  | "default";

export function detectVisualTheme(point: BuiltDifferentPoint): VisualTheme {
  const text = `${point.title} ${point.desc}`.toLowerCase();

  if (/m-pesa|mpesa|stk/.test(text)) return "mpesa";
  if (/99\.?9|uptime|sla|online/.test(text)) return "uptime";
  if (/ssl|secure|encrypt|protect|https|padlock|certificate/.test(text)) return "security";
  if (/migrat|transfer|move|zero downtime/.test(text)) return "migration";
  if (/100\+|trusted|businesses|clients|counties/.test(text)) return "trust";
  if (/visitor|wherever|local|\.co\.ke|latency/.test(text)) return "location";
  if (/hidden|kes|pricing|no .*fee|transparent|shilling/.test(text)) return "pricing";
  if (/seo|rank|google|growth|conversion|traffic/.test(text)) return "growth";
  if (/support|24\/7|chat|whatsapp|english and swahili/.test(text)) return "support";
  if (/deploy|vps|server|docker|minute|provision/.test(text)) return "deploy";
  if (/fast|speed|second|gbps|nvme|load/.test(text)) return "speed";

  return "default";
}

export function extractStat(text: string): string | null {
  const match = text.match(
    /(\d[\d.,]*(?:%|\+)?|\d+\s*(?:min|sec|ms|Gbps|TB|GB|MB|KES)?)/i,
  );
  return match?.[1]?.trim() ?? null;
}

export function extractKeywords(text: string): string[] {
  return text
    .split(/[\s—–-]+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);
}
