import { Badge } from "@/components/ui/badge";
import { type CreativeAssetStatus } from "./types";

interface AssetStatusBadgeProps {
  status: CreativeAssetStatus;
  className?: string;
}

export function AssetStatusBadge({ status, className }: AssetStatusBadgeProps) {
  const variants: Record<CreativeAssetStatus, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "outline",
    IN_REVIEW: "default",
    APPROVED: "default",
    ARCHIVED: "secondary",
  };

  const labels: Record<CreativeAssetStatus, string> = {
    DRAFT: "Draft",
    IN_REVIEW: "In Review",
    APPROVED: "Approved",
    ARCHIVED: "Archived",
  };

  return (
    <Badge variant={variants[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}

