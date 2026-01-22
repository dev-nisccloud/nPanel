"use client";

import * as React from "react";
import { Bell, Check, Mail, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import { useNotificationsSSE } from "@/hooks/use-notifications-sse";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-500";
    case "HIGH":
      return "bg-orange-500";
    case "NORMAL":
      return "bg-blue-500";
    case "LOW":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

export function NotificationSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [sseUnseenCount, setSseUnseenCount] = React.useState<number | null>(null);
  const [expandedNotifications, setExpandedNotifications] = React.useState<Set<string>>(new Set());
  const [updatingNotificationId, setUpdatingNotificationId] = React.useState<string | null>(null);
  const notificationsRef = React.useRef<Array<{
    id: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    [key: string]: unknown;
  }>>([]);

  // Helper to check if message is long enough to need truncation
  // Rough estimate: ~100 characters typically fits in 2 lines at 14px font
  const isLongMessage = (message: string) => {
    return message.length > 100;
  };

  const toggleExpand = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notification click handler
    setExpandedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  // Fetch notifications - always fetch all notifications, don't filter by 'since'
  // The 'since' parameter filters out old notifications, but we want to show all
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.getAll.useQuery(
    {
      limit: 50,
      offset: 0,
      // Don't use 'since' - we want all notifications including read ones
      // since: undefined,
    },
    {
      // Refetch when popover opens
      enabled: true,
      // Smart polling: only when tab is visible and popover is open
      refetchInterval: (query) => {
        // Don't poll if tab is hidden
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return false;
        }
        // Poll more frequently when popover is open
        return isOpen ? 15000 : 60000; // 15s when open, 60s when closed
      },
      refetchOnWindowFocus: true,
    }
  );

  // Refetch notifications when popover opens
  React.useEffect(() => {
    if (isOpen) {
      // Refetch all notifications when popover opens
      refetch();
    }
  }, [isOpen, refetch]);

  // Update notifications ref when data changes
  React.useEffect(() => {
    if (notifications) {
      notificationsRef.current = notifications as Array<{ id: string; createdAt: Date | string; updatedAt: Date | string; [key: string]: unknown; }>;
    }
  }, [notifications]);

  // Fetch unseen count with smart polling
  const { data: unseenCountData, refetch: refetchUnseenCount } = trpc.notifications.getUnseenCount.useQuery(
    undefined,
    {
      refetchInterval: (query) => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return false;
        }
        return 20000; // 20s polling for count
      },
      refetchOnWindowFocus: true,
    }
  );

  // SSE for real-time updates (when popover is open)
  const { isConnected: sseConnected } = useNotificationsSSE(
      (notification) => {
        // New notification received via SSE
        // Add to the beginning of the list
        const updated = [notification as unknown as { id: string; createdAt: Date | string; updatedAt: Date | string; [key: string]: unknown; }, ...notificationsRef.current.filter(n => n.id !== notification.id)];
        notificationsRef.current = updated;
      refetch(); // Refresh to get full data
      toast.info(notification.title || "New notification", {
        description: notification.message,
      });
    },
    (count) => {
      // Unseen count updated via SSE
      setSseUnseenCount(count);
      refetchUnseenCount();
    },
    isOpen // Only enable SSE when popover is open
  );

  // Use SSE count if available, otherwise use polling count
  const unseenCount = sseUnseenCount !== null ? sseUnseenCount : (unseenCountData?.count ?? 0);

  // Mark as seen mutation
  const markAsSeenMutation = trpc.notifications.markAsSeen.useMutation({
    onMutate: (variables) => {
      setUpdatingNotificationId(variables.id);
    },
    onSuccess: () => {
      refetch();
      refetchUnseenCount();
      setUpdatingNotificationId(null);
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read", {
        description: error.message,
      });
      setUpdatingNotificationId(null);
    },
  });

  // Mark as unseen mutation
  const markAsUnseenMutation = trpc.notifications.markAsUnseen.useMutation({
    onMutate: (variables) => {
      setUpdatingNotificationId(variables.id);
    },
    onSuccess: () => {
      refetch();
      refetchUnseenCount();
      setUpdatingNotificationId(null);
    },
    onError: (error) => {
      toast.error("Failed to mark notification as unread", {
        description: error.message,
      });
      setUpdatingNotificationId(null);
    },
  });

  // Mark all as read mutation
  const markAllAsSeenMutation = trpc.notifications.markAllAsSeen.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error("Failed to mark all as read", {
        description: error.message,
      });
    },
  });

  const handleNotificationClick = (notification: { id: string; link: string | null; seen: boolean }) => {
    // Mark as seen if not already seen
    if (!notification.seen) {
      markAsSeenMutation.mutate({ id: notification.id });
    }

    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  const handleToggleReadStatus = (e: React.MouseEvent<HTMLButtonElement>, notification: { id: string; seen: boolean }) => {
    e.stopPropagation(); // Prevent triggering the notification click handler
    e.preventDefault(); // Prevent any default button behavior
    if (notification.seen) {
      markAsUnseenMutation.mutate({ id: notification.id });
    } else {
      markAsSeenMutation.mutate({ id: notification.id });
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsSeenMutation.mutate({});
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unseenCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unseenCount > 9 ? "9+" : unseenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unseenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Spinner variant="ellipsis" className="text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                // Convert createdAt string to Date if needed
                // tRPC serializes Date objects to strings, so we need to handle both
                const createdAtValue = notification.createdAt as Date | string;
                const createdAt = createdAtValue instanceof Date 
                  ? createdAtValue 
                  : typeof createdAtValue === 'string'
                    ? new Date(createdAtValue)
                    : new Date(String(createdAtValue));

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-accent transition-colors cursor-pointer",
                      !notification.seen && "bg-accent/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full flex-shrink-0",
                          getPriorityColor(notification.priority)
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        {notification.title && (
                          <p className="text-sm font-medium text-foreground mb-1">
                            {notification.title}
                          </p>
                        )}
                        <div className="space-y-1">
                          <p
                            className={cn(
                              "text-sm text-muted-foreground",
                              !expandedNotifications.has(notification.id) && isLongMessage(notification.message)
                                ? "line-clamp-2"
                                : ""
                            )}
                          >
                            {notification.message}
                          </p>
                          {isLongMessage(notification.message) && (
                            <span
                              onClick={(e) => toggleExpand(notification.id, e)}
                              className="text-xs text-primary hover:underline cursor-pointer focus:outline-none"
                            >
                              {expandedNotifications.has(notification.id) ? "Show less" : "Show more"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatDistanceToNow(createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => handleToggleReadStatus(e, notification)}
                                type="button"
                                disabled={updatingNotificationId === notification.id}
                              >
                                {updatingNotificationId === notification.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : notification.seen ? (
                                  <Mail className="h-3.5 w-3.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{notification.seen ? "Mark as unread" : "Mark as read"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!notification.seen && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
