"use client";

import { Calendar, Shield } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { getInitials } from "@/lib/utils";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="hidden h-5 w-16 sm:block" />
    </div>
  );
}

export function ProfileHeader() {
  const { data: userInfo, isLoading } = trpc.userProfile.getUserInfo.useQuery();

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          {userInfo.image ? (
            <AvatarImage src={userInfo.image} alt={userInfo.name} />
          ) : null}
          <AvatarFallback className="text-sm font-medium">
            {getInitials(userInfo.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold">{userInfo.name}</p>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={userInfo.status === "ACTIVE" ? "outline" : "destructive"}
                className={
                  userInfo.status === "ACTIVE"
                    ? "h-5 px-1.5 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                    : "h-5 px-1.5 text-[10px]"
                }
              >
                {userInfo.status}
              </Badge>
              {userInfo.emailVerified && (
                <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[10px]">
                  <Shield className="h-2.5 w-2.5" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">{userInfo.email}</p>
        </div>
      </div>

      <dl className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
        <div>
          <dt className="text-muted-foreground">Member since</dt>
          <dd className="font-medium">{formatDate(userInfo.createdAt)}</dd>
        </div>
        {userInfo.lastLoginAt && (
          <div>
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Last login
            </dt>
            <dd className="font-medium whitespace-nowrap">{formatDateTime(userInfo.lastLoginAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
