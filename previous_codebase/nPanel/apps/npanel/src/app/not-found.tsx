"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function NotFound() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: teams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const [homeUrl, setHomeUrl] = useState<string>("/auth/login");

  useEffect(() => {
    if (session?.user && teams && teams.length > 0) {
      // Get lastAccessedTeamId from session
      const lastAccessedId = (session.user as { lastAccessedTeamId?: string })?.lastAccessedTeamId;
      
      // Find the team to redirect to
      const team = lastAccessedId 
        ? teams.find((t) => t.id === lastAccessedId) 
        : teams[0];
      
      if (team) {
        setHomeUrl(`/${team.slug}/dashboard`);
      }
    }
  }, [session, teams]);

  const handleGoHome = () => {
    router.push(homeUrl as never);
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="text-2xl font-semibold">Page not found.</h1>
      <p className="text-muted-foreground">The page you are looking for could not be found.</p>
      <Button variant="outline" onClick={handleGoHome}>
        Go back home
      </Button>
    </div>
  );
}
