import React from "react";
import { useNotification } from "./use-notification";

interface Message {
    id: string;
    senderId: string;
    content: string;
}

export function useNewMessageDetector(
    messages: Message[] | undefined,
    currentUserId: string | null | undefined,
    currentChatId: string | null
) {
    const { playSound, showBrowserNotification } = useNotification();
    const lastAnalyzedMessageIdRef = React.useRef<string | null>(null);

    // Initialize last message ID to avoid notifying for existing messages on first load
    React.useEffect(() => {
        if (messages && messages.length > 0 && !lastAnalyzedMessageIdRef.current) {
            lastAnalyzedMessageIdRef.current = messages[messages.length - 1].id;
        }
    }, [messages]);

    React.useEffect(() => {
        if (!messages || messages.length === 0 || !currentUserId) return;

        const latestMessage = messages[messages.length - 1];

        // If it's a new message and not from the current user
        if (
            latestMessage.id !== lastAnalyzedMessageIdRef.current &&
            latestMessage.senderId !== currentUserId
        ) {
            // Play sound
            playSound();

            // Show browser notification if tab is hidden or user is not viewing this specific chat
            // We check if document.hidden (tab not focused) OR if the currently open chat is NOT this one
            // (Though in the FloatingActionButton, this hook will likely be used within the active chat context,
            // so we might need more logic if we want list-wide detection)
            // Show browser notification if tab is hidden
            if (document.hidden) {
                showBrowserNotification("New Message", {
                    body: latestMessage.content.substring(0, 100),
                    icon: "/favicon.ico",
                    tag: currentChatId || "new-message",
                    renotify: true,
                } as any);
            }

            lastAnalyzedMessageIdRef.current = latestMessage.id;
        }
    }, [messages, currentUserId, currentChatId, playSound, showBrowserNotification]);
}
