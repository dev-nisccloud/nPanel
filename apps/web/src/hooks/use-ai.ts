"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

/**
 * Hook to fetch AI chat history
 */
export function useAiHistory(filters?: { teamId?: string }) {
    const query = trpc.ai.history.getHistory.useQuery(
        {
            teamId: filters?.teamId,
            limit: 50,
            offset: 0,
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: true,
        }
    );

    return {
        history: query.data || [],
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to fetch a single AI chat with messages
 */
export function useAiChat(chatId: string | null) {
    const query = trpc.ai.history.getById.useQuery(
        { id: chatId! },
        {
            enabled: !!chatId,
            refetchOnWindowFocus: false,
        }
    );

    return {
        chat: query.data,
        messages: query.data?.messages || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook for AI chat mutations
 */
export function useAiMutations() {
    const utils = trpc.useUtils();

    const startChat = trpc.ai.chat.start.useMutation({
        onSuccess: () => {
            utils.ai.history.getHistory.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to start AI chat: " + error.message);
        },
    });

    const sendMessage = trpc.ai.chat.sendMessage.useMutation({
        onSuccess: (data, variables) => {
            utils.ai.history.getById.invalidate({ id: variables.chatId });
            utils.ai.history.getHistory.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to send message: " + error.message);
        },
    });

    const escalateChat = trpc.ai.chat.escalate.useMutation({
        onSuccess: () => {
            utils.ai.history.getHistory.invalidate();
            toast.success("Escalated to a human agent.");
        },
        onError: (error) => {
            toast.error("Failed to escalate: " + error.message);
        },
    });

    const deleteChat = trpc.ai.chat.delete.useMutation({
        onSuccess: () => {
            utils.ai.history.getHistory.invalidate();
            toast.success("Chat history deleted.");
        },
        onError: (error) => {
            toast.error("Failed to delete chat: " + error.message);
        },
    });

    return {
        startChat,
        sendMessage,
        escalateChat,
        deleteChat,
    };
}
