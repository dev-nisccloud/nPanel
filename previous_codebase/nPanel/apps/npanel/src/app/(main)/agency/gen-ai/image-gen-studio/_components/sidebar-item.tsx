import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
};

export const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: SidebarItemProps) => {
  return (
    <li className="w-full">
      <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
          "w-full !h-auto min-h-0 aspect-video p-3 py-3 flex flex-col rounded-none gap-y-1.5",
          isActive && "bg-muted text-primary"
        )}
      >
        <Icon className="size-5 stroke-2 shrink-0" />
        <span className="text-xs leading-tight">
          {label}
        </span>
      </Button>
    </li>
  );
};


