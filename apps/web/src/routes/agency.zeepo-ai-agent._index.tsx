"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusIcon, Trash2Icon, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ChatListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Loading chats">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-2/5 max-w-xs mb-2" />
          <Skeleton className="h-3 w-1/3 max-w-[10rem]" />
        </li>
      ))}
    </ul>
  );
}

export default function ZeepoAiAgentIndexPage() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const listQuery = trpc.zeepoAgent.sessions.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: Boolean(session?.user), retry: 1 },
  );

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();

  const deleteSession = trpc.zeepoAgent.sessions.delete.useMutation({
    onSuccess: () => {
      void utils.zeepoAgent.sessions.list.invalidate();
      toast.success("Chat deleted");
    },
    onError: (e) => toast.error(e.message || "Failed to delete"),
  });

  const handleNewChat = async () => {
    try {
      const res = await createSession.mutateAsync({});
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) {
        navigate(`/agency/zeepo-ai-agent/${id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create chat";
      toast.error(msg);
    }
  };

  if (authPending) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Spinner size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  const rows = listQuery.data?.data ?? [];
  const listLoading = listQuery.isPending || listQuery.isLoading;
  const listError = listQuery.isError;
  const listErrorMessage = listQuery.error?.message ?? "Something went wrong while loading chats.";

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 py-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Zeepo AI Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat with Zeepo to generate text, images, video, and audio.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleNewChat()}
          disabled={createSession.isPending || listLoading}
          className="shrink-0 gap-2"
        >
          {createSession.isPending ? <Spinner size={16} /> : <PlusIcon className="size-4" />}
          New chat
        </Button>
      </div>

      {listQuery.isFetching && !listLoading ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Refreshing list…
        </p>
      ) : null}

      {listError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn&apos;t load chats</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">{listErrorMessage}</span>
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2 border-destructive/40" onClick={() => void listQuery.refetch()}>
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {listLoading ? (
        <ChatListSkeleton />
      ) : listError ? null : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No chats yet</CardTitle>
            <CardDescription>Start a new conversation to create your first session.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((s) => (
            <li key={s.id} className="group relative">
              <div className="flex items-stretch gap-1 rounded-xl border bg-card transition-colors hover:bg-muted/30">
                <Link
                  to={`/agency/zeepo-ai-agent/${s.id}`}
                  className="min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <Card className="border-0 bg-transparent shadow-none">
                    <CardHeader className="py-4 pr-2">
                      <CardTitle className="text-base font-medium">
                        {s.title || "Untitled"}
                      </CardTitle>
                      <CardDescription>
                        Updated {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <div
                  className={cn(
                    "flex shrink-0 items-center pr-1 transition-opacity",
                    "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:text-destructive"
                    aria-label="Delete chat"
                    disabled={deleteSession.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteSession.mutate({ id: s.id });
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
