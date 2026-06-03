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

/**
 * Builds a DiceBear "thumbs" avatar URL seeded from the user's name or email.
 * Produces a consistent, unique illustrated thumb avatar for every user with no real photo.
 */
function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

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
  const generatedSrc = dicebearUrl(label);

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
