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
    currentChatId: string | null,
    isChatOpen: boolean = false,
    onMessageReceived?: (message: Message) => void
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
                // Logic: If user is actively viewing this chat (implicit match by hook usage + isOpen), 
                // do NOT play sound. Instead, trigger "read" action.
                // We assume if this hook is mounted with currentChatId matching the messages, we are "in" the chat.
                // But we check `isChatOpen` to be sure the UI is visible.

                if (isChatOpen) {
                    // Silent handling: Mark as read immediately, no sound
                    onMessageReceived?.(latestMessage);
                } else {
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
        }
    }, [messages, currentUserId, currentChatId, isChatOpen, playSound, showBrowserNotification, onMessageReceived]);
}
