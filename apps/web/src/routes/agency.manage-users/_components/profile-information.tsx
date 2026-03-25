"use client";

import * as React from "react";
import { Phone, MapPin, User } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

interface ProfileInformationProps {
  userId: string;
}

export function ProfileInformation({ userId }: ProfileInformationProps) {
  const { data: profile, isLoading, error } = trpc.manageUsers.getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">{error.message || "Failed to load profile"}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No profile information available</p>
      </div>
    );
  }

  const hasProfileData = profile.firstName || profile.lastName || profile.phone || 
    profile.address || profile.city || profile.state || profile.country || profile.postalCode;

  if (!hasProfileData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No profile information has been added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      {(profile.firstName || profile.lastName || profile.phone) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-2 gap-6">
            {profile.firstName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>First Name</span>
                </div>
                <p className="text-sm font-medium">{profile.firstName}</p>
              </div>
            )}
            {profile.lastName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Last Name</span>
                </div>
                <p className="text-sm font-medium">{profile.lastName}</p>
              </div>
            )}
            {profile.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </div>
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information */}
      {(profile.address || profile.city || profile.state || profile.country || profile.postalCode) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address Information</h3>
          <div className="grid grid-cols-2 gap-6">
            {profile.address && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </div>
                <p className="text-sm font-medium">{profile.address}</p>
              </div>
            )}
            {profile.city && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>City</span>
                </div>
                <p className="text-sm font-medium">{profile.city}</p>
              </div>
            )}
            {profile.state && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>State/Province</span>
                </div>
                <p className="text-sm font-medium">{profile.state}</p>
              </div>
            )}
            {profile.postalCode && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Postal Code</span>
                </div>
                <p className="text-sm font-medium">{profile.postalCode}</p>
              </div>
            )}
            {profile.country && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Country</span>
                </div>
                <p className="text-sm font-medium">{profile.country}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

