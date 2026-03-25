"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { data: teams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const [homeUrl, setHomeUrl] = useState("/auth/login");

  useEffect(() => {
    if (session?.user && teams && teams.length > 0) {
      const lastAccessedId = (session.user as { lastAccessedTeamId?: string })?.lastAccessedTeamId;
      const team = lastAccessedId ? teams.find((t) => t.id === lastAccessedId) : teams[0];
      if (team) {
        setHomeUrl(`/${team.slug}/dashboard`);
      }
    }
  }, [session, teams]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="text-2xl font-semibold">Page not found.</h1>
      <p className="text-muted-foreground">The page you are looking for could not be found.</p>
      <Button variant="outline" type="button" onClick={() => navigate(homeUrl)}>
        Go back home
      </Button>
    </div>
  );
}
