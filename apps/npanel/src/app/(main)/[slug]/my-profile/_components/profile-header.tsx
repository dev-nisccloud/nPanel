"use client";

import { Shield } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { getInitials } from "@/lib/utils";

// Loading skeleton
function ProfileHeaderSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {userInfo.image ? (
              <AvatarImage src={userInfo.image} alt={userInfo.name} />
            ) : null}
            <AvatarFallback className="text-2xl font-semibold">
              {getInitials(userInfo.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{userInfo.name}</h2>
            <p className="text-muted-foreground">{userInfo.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={userInfo.status === "ACTIVE" ? "default" : "destructive"}>
                {userInfo.status}
              </Badge>
              {userInfo.emailVerified && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



