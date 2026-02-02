"use client";

import { trpc } from "@/utils/trpc";

/**
 * Hook for ticket mutations (customer side)
 */
export function useTicketMutations() {
  const utils = trpc.useUtils();

  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: () => {
      utils.tickets.getList.invalidate();
    },
    onError: (error) => {
      console.error("Failed to create ticket:", error);
    },
  });

  const createMessage = trpc.tickets.createMessage.useMutation({
    onSuccess: (_, variables) => {
      utils.tickets.getMessages.invalidate({ ticketId: variables.ticketId });
      utils.tickets.getById.invalidate({ id: variables.ticketId });
      utils.tickets.getList.invalidate();
    },
    onError: (error) => {
      console.error("Failed to create message:", error);
    },
  });

  const markMessageRead = trpc.tickets.markMessageRead.useMutation({
    onSuccess: () => {
      utils.tickets.getMessages.invalidate();
      utils.tickets.getById.invalidate();
      utils.tickets.getList.invalidate();
    },
    onError: (error) => {
      console.error("Failed to mark message as read:", error);
    },
  });

  const markAllTicketMessagesAsRead = trpc.tickets.markAllTicketMessagesAsRead.useMutation({
    onSuccess: () => {
      utils.tickets.getMessages.invalidate();
      utils.tickets.getById.invalidate();
      utils.tickets.getList.invalidate();
    },
    onError: (error) => {
      console.error("Failed to mark messages as read:", error);
    },
  });

  return {
    createTicket,
    createMessage,
    markMessageRead,
    markAllTicketMessagesAsRead,
  };
}
