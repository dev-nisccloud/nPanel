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
    // We can do this in a single effect now
    React.useEffect(() => {
        if (!messages || messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];

        // If this is the very first run (ref is null), just set the ref and return
        if (lastAnalyzedMessageIdRef.current === null) {
            lastAnalyzedMessageIdRef.current = latestMessage.id;
            return;
        }

        // Check if it's a new message
        if (latestMessage.id !== lastAnalyzedMessageIdRef.current) {
            // Update ref immediately
            lastAnalyzedMessageIdRef.current = latestMessage.id;

            // Only notify if it's NOT from the current user
            if (currentUserId && latestMessage.senderId !== currentUserId) {
                // Play sound
                playSound();

                // Show browser notification if tab is hidden
                if (document.hidden) {
                    showBrowserNotification("New Message", {
                        body: latestMessage.content.substring(0, 100),
                        icon: "/favicon.ico",
                        tag: currentChatId || "new-message",
                        renotify: true,
                    } as any);
                }
            }
        }
    }, [messages, currentUserId, currentChatId, playSound, showBrowserNotification]);
}
