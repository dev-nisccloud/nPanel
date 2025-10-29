"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Users } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  
  const [isAccepting, setIsAccepting] = useState(false);
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  // Get invite details
  const { 
    data: inviteData, 
    isLoading: isInviteLoading,
    error: inviteError 
  } = trpc.teams.getInviteByCode.useQuery(
    { code: code || "" },
    { enabled: !!code }
  );

  // Accept invite mutation
  const acceptInviteMutation = trpc.teams.acceptInvite.useMutation({
    onSuccess: (data) => {
      if (data.success && data.teamSlug) {
        toast.success("You've successfully joined the team!");
        // Redirect to the team's dashboard using its slug
        router.push(`/${data.teamSlug}/default` as never);
      } else {
        toast.error(data.error || "Failed to accept invitation");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });

  const handleAcceptInvite = async () => {
    if (!code) return;
    
    setIsAccepting(true);
    await acceptInviteMutation.mutateAsync({ code });
    setIsAccepting(false);
  };

  // Show loading state while checking session
  if (isSessionLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Spinner variant="ellipsis" className="text-primary" />
              <p className="text-muted-foreground">Loading your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login/register prompt if not authenticated
  if (!session?.user && inviteData?.valid) {
    const invite = inviteData.invite!;
    
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            {/* Team Logo */}
            {invite.team.logoUrl ? (
              <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full">
                <Image 
                  src={invite.team.logoUrl} 
                  alt={`${invite.team.name} logo`} 
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}

            <CardTitle className="text-center text-2xl">Join {invite.team.name}</CardTitle>
            <CardDescription className="text-center">
              You need an account to proceed
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              You do not have an account to view resources of this team. Create an account or sign in to join.
            </p>

            {/* Invite Details */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team:</span>
                <span className="font-medium">{invite.team.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Role:</span>
                <span className="font-medium capitalize">{invite.role.toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invited Email:</span>
                <span className="font-medium">{invite.email}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push(`/auth/register?redirect=/accept-invite&code=${code}`)}
                className="w-full"
              >
                Create Account
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/auth/login?redirect=/accept-invite&code=${code}`)}
                className="w-full"
              >
                Sign In
              </Button>
            </div>

            {/* Security Note */}
            <p className="text-center text-xs text-muted-foreground">
              After signing in, you'll be able to accept the invitation
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No invite code provided
  if (!code) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              No invitation code was provided
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading invite data
  if (isInviteLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Spinner variant="ellipsis" className="text-primary" />
              <p className="text-muted-foreground">Loading invitation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired invite
  if (!inviteData?.valid || inviteError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {inviteData?.error || "This invitation is no longer valid"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              The invitation may have expired, been cancelled, or already been used.
            </p>
            <Button onClick={() => router.push("/create-team")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite - show acceptance UI
  const invite = inviteData.invite!;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {/* Team Logo */}
          {invite.team.logoUrl ? (
            <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full">
              <Image 
                src={invite.team.logoUrl} 
                alt={`${invite.team.name} logo`} 
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          )}

          <CardTitle className="text-center text-2xl">Join {invite.team.name}</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join this team as a {invite.role.toLowerCase()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Invite Details */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Team:</span>
              <span className="font-medium">{invite.team.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Role:</span>
              <span className="font-medium capitalize">{invite.role.toLowerCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invited Email:</span>
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">As a team member, you will be able to:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Collaborate with your team members</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Access and manage team resources</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>View invoices and billing information</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Manage domains and hosting services</span>
              </li>
            </ul>
          </div>

          {/* Accept Button */}
          <Button 
            onClick={handleAcceptInvite} 
            className="w-full"
            disabled={isAccepting || acceptInviteMutation.isPending}
          >
            {isAccepting || acceptInviteMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                <span>Joining team...</span>
              </div>
            ) : (
              "Accept Invitation & Join Team"
            )}
          </Button>

          {/* Decline Option */}
          <Button 
            variant="outline" 
            onClick={() => router.push("/create-team")}
            className="w-full"
            disabled={isAccepting || acceptInviteMutation.isPending}
          >
            Maybe Later
          </Button>

          {/* Security Note */}
          <p className="text-center text-xs text-muted-foreground">
            By accepting, you agree to collaborate with this team on nPanel
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
