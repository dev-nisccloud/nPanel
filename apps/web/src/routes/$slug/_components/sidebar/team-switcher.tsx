"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSwitchingTeam } from "@/contexts/switching-team-context";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getInitials } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";
import { trpc } from "@/utils/trpc";

export function TeamSwitcher() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { startSwitchTeam } = useSwitchingTeam();

  // Extract current team slug from URL (first segment after /)
  const currentSlug = pathname.split("/")[1];

  // Fetch user's teams with caching
  const { data: teams, isLoading, error } = trpc.teams.getUserTeams.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Active team is determined by URL slug (no state needed!)
  const activeTeam = teams?.find((team) => team.slug === currentSlug);

  const updateLastAccessed = trpc.teams.updateLastAccessedTeam.useMutation({
    onError: () => {
      // Non-blocking: layout's verifyTeamAccess will update on next load if this fails
    },
  });

  const handleTeamSwitch = (teamId: string, teamSlug: string) => {
    captureEvent("organization_switched", {
      from_org_id: activeTeam?.id,
      to_org_id: teamId,
    });
    startSwitchTeam();
    updateLastAccessed.mutate({ teamId });
    const target = `/${teamSlug}/dashboard` as never;
    setTimeout(() => {
      navigate(target);
    }, 0);
  };

  const handleCreateTeam = () => {
    navigate("/create-organization");
  };

  // Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Spinner variant="ellipsis" className="text-muted-foreground" size="sm" />
      </Button>
    );
  }

  // Error state
  if (error) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg">?</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // No organizations state
  if (!teams || teams.length === 0) {
    return (
      <Button variant="ghost" size="icon" onClick={handleCreateTeam}>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg">
            <Plus className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2 data-[state=open]:bg-accent">
          <Avatar className="h-8 w-8 rounded-lg">
            {activeTeam?.logoUrl ? (
              <AvatarImage src={activeTeam.logoUrl} alt={activeTeam.name} />
            ) : null}
            <AvatarFallback className="rounded-lg text-xs font-semibold">
              {getInitials(activeTeam?.name || "Organization")}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-0.5">
            <span className="text-sm font-medium leading-none">{activeTeam?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {activeTeam?.role?.toLowerCase() || "Member"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => handleTeamSwitch(team.id, team.slug)}
            className="gap-2 p-2"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              {team.logoUrl ? (
                <AvatarImage src={team.logoUrl} alt={team.name} />
              ) : null}
              <AvatarFallback className="rounded-lg text-xs font-semibold">
                {getInitials(team.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{team.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {team.role?.toLowerCase() || "Member"}
              </span>
            </div>
            {team.slug === currentSlug && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateTeam} className="gap-2 p-2">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg">
              <Plus className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

