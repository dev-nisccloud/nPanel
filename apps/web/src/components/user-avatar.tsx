"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getDicebearUrl, getInitials } from "@/lib/utils";

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
  const generatedSrc = getDicebearUrl(label);

  return (
    <Avatar className={className}>
      {/* Real profile photo takes priority; DiceBear fills in for everyone else */}
      <AvatarImage
        src={src ?? generatedSrc}
        alt={label}
        referrerPolicy="no-referrer"
      />
      {/* Initials as a true last-resort if the network request fails */}
      <AvatarFallback className={cn(fallbackClassName)}>
        {getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
