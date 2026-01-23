"use client";

import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";

/**
 * Hook for ticket mutations
 */
export function useTicketMutations() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: (data) => {
      utils.tickets.getList.invalidate();
      return data;
    },
    onError: (error) => {
      console.error("Failed to create ticket:", error);
    },
  });

  const updateTicket = trpc.tickets.update.useMutation({
    onSuccess: () => {
      utils.tickets.getList.invalidate();
      utils.tickets.getById.invalidate();
    },
    onError: (error) => {
      console.error("Failed to update ticket:", error);
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
    onSuccess: (_, variables) => {
      utils.tickets.getMessages.invalidate();
      utils.tickets.getById.invalidate();
      utils.tickets.getList.invalidate();
    },
    onError: (error) => {
      console.error("Failed to mark message as read:", error);
    },
  });

  const assignTicket = trpc.tickets.assign.useMutation({
    onSuccess: () => {
      utils.tickets.getList.invalidate();
      utils.tickets.getById.invalidate();
    },
    onError: (error) => {
      console.error("Failed to assign ticket:", error);
    },
  });

  const updateStatus = trpc.tickets.updateStatus.useMutation({
    onSuccess: () => {
      utils.tickets.getList.invalidate();
      utils.tickets.getById.invalidate();
    },
    onError: (error) => {
      console.error("Failed to update ticket status:", error);
    },
  });

  const archiveTicket = trpc.tickets.archive.useMutation({
    onSuccess: () => {
      utils.tickets.getList.invalidate();
      utils.tickets.getById.invalidate();
    },
    onError: (error) => {
      console.error("Failed to archive ticket:", error);
    },
  });

  return {
    createTicket,
    updateTicket,
    createMessage,
    markMessageRead,
    assignTicket,
    updateStatus,
    archiveTicket,
  };
}
