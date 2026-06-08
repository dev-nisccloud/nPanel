"use client";

import type { ReactNode } from "react";
import { Calendar, Shield } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ClientStatusBadge } from "./client-status-badge";

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

interface ClientProfileHeaderProps {
  client: {
    name: string;
    email: string;
    emailVerified: boolean;
    status: string;
    role: string;
    image: string | null;
    createdAt: Date | string;
    lastLoginAt?: Date | string | null;
  };
  actions?: ReactNode;
}

export function ClientProfileHeader({ client, actions }: ClientProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar
          name={client.name}
          email={client.email}
          image={client.image}
          className="h-11 w-11 shrink-0"
          fallbackClassName="text-sm font-medium"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold">{client.name}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <ClientStatusBadge status={client.status} />
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {client.role}
              </Badge>
              {client.emailVerified && (
                <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[10px]">
                  <Shield className="h-2.5 w-2.5" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t pt-2 sm:border-t-0 sm:pt-0">
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:border-l sm:pl-4">
          <div>
            <dt className="text-muted-foreground">Client since</dt>
            <dd className="font-medium">{formatDate(client.createdAt)}</dd>
          </div>
          {client.lastLoginAt && (
            <div>
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Last login
              </dt>
              <dd className="font-medium whitespace-nowrap">{formatDateTime(client.lastLoginAt)}</dd>
            </div>
          )}
        </dl>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
    </div>
  );
}
