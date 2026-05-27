"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
  fallbackClassName?: string;
};

/** OAuth avatars (e.g. Google) require no-referrer when loaded from external URLs. */
export function UserAvatar({
  name,
  email,
  image,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const label = name?.trim() || email?.trim() || "User";
  const src = image?.trim() || undefined;

  return (
    <Avatar className={className}>
      {src ? (
        <AvatarImage src={src} alt={label} referrerPolicy="no-referrer" />
      ) : null}
      <AvatarFallback className={cn(fallbackClassName)}>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}
