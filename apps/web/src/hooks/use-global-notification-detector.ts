import React from "react";
import { useNotification } from "./use-notification";
import type { TicketListItem } from "@/routes/agency/_components/tickets/schema";

export function useGlobalNotificationDetector(
    tickets: TicketListItem[] | undefined,
    currentChatId: string | null
) {
    const { playSound, showBrowserNotification } = useNotification();
    const lastTotalUnreadCountRef = React.useRef<number>(0);
    const isFirstLoadRef = React.useRef(true);

    // Calculate total unread count excluding the currently active chat
    const totalUnreadCount = React.useMemo(() => {
        if (!tickets) return 0;
        return tickets.reduce((acc, ticket) => {
            // If we're currently viewing this chat, don't include it in the global notification count
            // because the local message detector or the user's active attention handles it.
            if (ticket.id === currentChatId) return acc;
            return acc + ticket.unreadCount;
        }, 0);
    }, [tickets, currentChatId]);

    React.useEffect(() => {
        if (tickets === undefined) return;

        // On first load, just set the initial count
        if (isFirstLoadRef.current) {
            lastTotalUnreadCountRef.current = totalUnreadCount;
            isFirstLoadRef.current = false;
            return;
        }

        // If total unread count increased
        if (totalUnreadCount > lastTotalUnreadCountRef.current) {
            // Find the ticket that caused the increase to get its last message
            const ticketWithNewMessage = tickets.find(t =>
                t.unreadCount > 0 &&
                t.id !== currentChatId &&
                // This is a bit naive but works for the common case of unread count increasing
                (!lastTotalUnreadCountRef.current || t.unreadCount > 0)
            );

            if (ticketWithNewMessage) {
                playSound();

                // Show browser notification for messages in other chats
                // We show this even if the tab is visible, as long as it's not the active chat
                showBrowserNotification(`New Message from ${ticketWithNewMessage.customerName || "Customer"}`, {
                    body: ticketWithNewMessage.lastMessage || "Click to view message",
                    icon: "/favicon.ico",
                    tag: ticketWithNewMessage.id,
                    renotify: true,
                } as any);
            }
        }

        lastTotalUnreadCountRef.current = totalUnreadCount;
    }, [totalUnreadCount, tickets, currentChatId, playSound, showBrowserNotification]);
}
