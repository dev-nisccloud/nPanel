import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: string) {
  if (status === "ACTIVE") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
  }
  return "";
}

interface ClientStatusBadgeProps {
  status: string;
  className?: string;
}

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  return (
    <Badge
      variant={status === "ACTIVE" ? "outline" : "destructive"}
      className={cn("h-5 px-1.5 text-[10px]", statusBadgeClass(status), className)}
    >
      {status}
    </Badge>
  );
}
