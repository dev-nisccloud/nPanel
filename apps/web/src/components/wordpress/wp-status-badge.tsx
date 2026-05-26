import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WpStatusTone = "success" | "warning" | "danger" | "muted";

export function getWpStatusTone(label?: string | null): WpStatusTone {
  const s = (label ?? "").toLowerCase().trim();
  if (!s) return "warning";
  if (
    /critical|high|severe|failed|error|infected|vulnerable|blocked|compromised|danger/.test(s)
  ) {
    return "danger";
  }
  if (/low|ok|done|complete|completed|applied|fixed|clean|safe|none|passed|success/.test(s)) {
    return "success";
  }
  if (/medium|moderate|pending|unknown|running|progress|warning|review/.test(s)) {
    return "warning";
  }
  return "warning";
}

export function wpStatusBadgeClassName(tone: WpStatusTone): string {
  switch (tone) {
    case "danger":
      return "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/10";
    case "success":
      return "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10";
    case "muted":
      return "border-border bg-muted/50 text-muted-foreground hover:bg-muted/50";
    case "warning":
    default:
      return "border-border bg-muted text-foreground hover:bg-muted";
  }
}

export function WpStatusBadge({
  label,
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  if (!label) return null;
  const tone = getWpStatusTone(label);
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 capitalize text-xs", wpStatusBadgeClassName(tone), className)}
    >
      {label}
    </Badge>
  );
}
