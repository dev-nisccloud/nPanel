"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { ticketListItemSchema, ticketSchema, ticketMessageSchema } from "./schema";
import type { TicketListItem, Ticket, TicketMessage } from "./schema";

/**
 * Hook to fetch tickets list (for chat list view)
 */
export function useTicketsList(filters?: {
  status?: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | "CANCELLED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  type?: string;
  teamId?: string;
}) {
  const query = trpc.tickets.getList.useQuery(
    {
      status: filters?.status,
      priority: filters?.priority,
      type: filters?.type as any,
      teamId: filters?.teamId,
      limit: 100,
      offset: 0,
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Transform and validate data
  const tickets: TicketListItem[] = React.useMemo(() => {
    if (!query.data) return [];
    
    return query.data.map((ticket) => {
      const parsed = ticketListItemSchema.safeParse(ticket);
      if (parsed.success) {
        return parsed.data;
      }
      console.error("Invalid ticket list item:", parsed.error);
      return null;
    }).filter((ticket): ticket is TicketListItem => ticket !== null);
  }, [query.data]);

  return {
    tickets,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single ticket by ID
 */
export function useTicket(ticketId: string | null) {
  const query = trpc.tickets.getById.useQuery(
    { id: ticketId! },
    {
      enabled: !!ticketId,
      refetchOnWindowFocus: false,
    }
  );

  const ticket: Ticket | null = React.useMemo(() => {
    if (!query.data) return null;
    
    const parsed = ticketSchema.safeParse(query.data);
    if (parsed.success) {
      return parsed.data;
    }
    console.error("Invalid ticket:", parsed.error);
    return null;
  }, [query.data]);

  return {
    ticket,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch messages for a ticket
 */
export function useTicketMessages(ticketId: string | null) {
  const query = trpc.tickets.getMessages.useQuery(
    { ticketId: ticketId!, limit: 100, offset: 0 },
    {
      enabled: !!ticketId && ticketId !== null && ticketId !== undefined,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchInterval: 15_000, // Poll every 15s so agency replies show without manual refresh
    }
  );

  const messages: TicketMessage[] = React.useMemo(() => {
    if (!query.data?.messages) return [];
    
    return query.data.messages.map((msg) => {
      const parsed = ticketMessageSchema.safeParse(msg);
      if (parsed.success) {
        return parsed.data;
      }
      console.error("Invalid ticket message:", parsed.error);
      return null;
    }).filter((msg): msg is TicketMessage => msg !== null);
  }, [query.data]);

  return {
    messages,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
