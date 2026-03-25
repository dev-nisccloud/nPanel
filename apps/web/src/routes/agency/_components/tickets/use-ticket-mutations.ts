"use client";

import { trpc } from "@/utils/trpc";

/**
 * Hook for ticket mutations
 */
export function useTicketMutations({ currentUserId }: { currentUserId?: string | null } = {}) {
  const utils = trpc.useUtils();

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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await utils.tickets.getMessages.cancel({ ticketId: variables.ticketId });
      await utils.tickets.getList.cancel();

      // Snapshot the previous value
      const previousMessages = utils.tickets.getMessages.getData({ ticketId: variables.ticketId });

      // Optimistically update to the new value
      if (currentUserId && variables.content) {
        utils.tickets.getMessages.setData(
          { ticketId: variables.ticketId, limit: 100, offset: 0 },
          (old) => {
            if (!old) return { messages: [], total: 0 };

            const newMessage = {
              id: `optimistic-${Date.now()}`,
              ticketId: variables.ticketId,
              senderId: currentUserId,
              content: variables.content,
              isInternal: variables.isInternal ?? false,
              isSystem: false,
              readStatus: "SENT" as const,
              readAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              editedAt: null,
              deletedAt: null,
              attachments: variables.attachments?.map(a => ({
                id: `opt-att-${Date.now()}`,
                ...a
              })) ?? [],
            };

            return {
              ...old,
              messages: [...old.messages, newMessage],
              total: old.total + 1,
            };
          }
        );
      }

      return { previousMessages };
    },
    onSuccess: (_, variables) => {
      utils.tickets.getMessages.invalidate({ ticketId: variables.ticketId });
      utils.tickets.getById.invalidate({ id: variables.ticketId });
      utils.tickets.getList.invalidate();
    },
    onError: (error, variables, context) => {
      console.error("Failed to create message:", error);
      // Rollback
      if (context?.previousMessages) {
        utils.tickets.getMessages.setData(
          { ticketId: variables.ticketId, limit: 100, offset: 0 },
          context.previousMessages
        );
      }
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

  const markAllTicketMessagesAsRead = trpc.tickets.markAllTicketMessagesAsRead.useMutation({
    onMutate: async (variables) => {
      // We cannot easily optimistically update the list without exact query variables.
      // We relying on invalidation in onSuccess.
      return {};
    },
    onSuccess: (_, variables) => {
      utils.tickets.getMessages.invalidate({ ticketId: variables.ticketId });
      utils.tickets.getById.invalidate({ id: variables.ticketId });
      // Use selective list invalidation or just invalidate the list
      utils.tickets.getList.invalidate();
    },
    onError: (error, variables, context) => {
      console.error("Failed to mark messages as read:", error);
      // No rollback needed for list since we didn't optimistically update it
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
    markAllTicketMessagesAsRead,
    assignTicket,
    updateStatus,
    archiveTicket,
  };
}
