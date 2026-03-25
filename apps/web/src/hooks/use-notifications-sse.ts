"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface NotificationEvent {
  type: 'notification' | 'unseen_count' | 'connected' | 'heartbeat';
  data: unknown;
}

interface Notification {
  id: string;
  userId: string;
  teamId: string | null;
  type: string;
  priority: string;
  title: string | null;
  message: string;
  link: string | null;
  seen: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseNotificationsSSEReturn {
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

/**
 * Hook for Server-Sent Events (SSE) connection to receive real-time notifications
 * Falls back gracefully if SSE is not available
 */
export function useNotificationsSSE(
  onNotification: (notification: Notification) => void,
  onUnseenCount: (count: number) => void,
  enabled: boolean = true
): UseNotificationsSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          // SSE sends data in format: data: <json>\n\n
          // event.data already contains the JSON string
          const parsed: NotificationEvent = JSON.parse(event.data);
          
          switch (parsed.type) {
            case 'notification':
              onNotification(parsed.data as Notification);
              break;
            case 'unseen_count':
              onUnseenCount((parsed.data as { count: number }).count);
              break;
            case 'connected':
              // Connection established
              break;
            case 'heartbeat':
              // Keep connection alive
              break;
            default:
              // Unknown event type, ignore
              break;
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err, event.data);
        }
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setError(new Error("SSE connection error"));

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts.current);
        } else {
          // Max reconnection attempts reached
          console.warn("Max SSE reconnection attempts reached");
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create SSE connection"));
      setIsConnected(false);
    }
  }, [enabled, onNotification, onUnseenCount]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, connect]);

  return {
    isConnected,
    error,
    reconnect,
  };
}
