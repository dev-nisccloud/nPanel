import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Matches WordPress list/table status badge styling. */
export const WP_INSTALLATION_STATUS_BADGE_CLASS = {
  online:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
  negative:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
  size: "px-2 py-0.5",
} as const;

type InstallationStatus = {
  alive?: boolean;
  infected?: boolean;
  unsupported?: boolean;
};

export function WpInstallationStatusBadge({
  status,
  className,
}: {
  status?: InstallationStatus;
  className?: string;
}) {
  const badgeClass = cn(
    WP_INSTALLATION_STATUS_BADGE_CLASS.size,
    className,
  );

  if (status?.infected) {
    return (
      <Badge variant="outline" className={cn(WP_INSTALLATION_STATUS_BADGE_CLASS.negative, badgeClass)}>
        Infected
      </Badge>
    );
  }

  if (status?.unsupported) {
    return (
      <Badge variant="outline" className={cn(WP_INSTALLATION_STATUS_BADGE_CLASS.negative, badgeClass)}>
        Unsupported
      </Badge>
    );
  }

  if (status?.alive) {
    return (
      <Badge variant="outline" className={cn(WP_INSTALLATION_STATUS_BADGE_CLASS.online, badgeClass)}>
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(WP_INSTALLATION_STATUS_BADGE_CLASS.negative, badgeClass)}>
      Offline
    </Badge>
  );
}
