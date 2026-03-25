import { Badge } from "@/components/ui/badge";
import { VersionApprovalStatus } from "./types";

interface VersionStatusBadgeProps {
  status: VersionApprovalStatus;
  className?: string;
}

export function VersionStatusBadge({ status, className }: VersionStatusBadgeProps) {
  const variants: Record<VersionApprovalStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    REJECTED: "destructive",
    NOT_APPLICABLE: "secondary",
  };

  const labels: Record<VersionApprovalStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    NOT_APPLICABLE: "N/A",
  };

  return (
    <Badge variant={variants[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}

