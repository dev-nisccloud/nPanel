"use client";

import * as React from "react";
import { Bell, Check, Mail, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router";

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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
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
      // Fetch once on mount; explicit refetch when popover opens or on key state changes.
      enabled: true,
      refetchOnWindowFocus: true,
      refetchInterval: false,
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
      notificationsRef.current = notifications as Array<{ id: string; createdAt: Date | string; updatedAt: Date | string;[key: string]: unknown; }>;
    }
  }, [notifications]);

  // Fetch unseen count with smart polling
  const { data: unseenCountData, refetch: refetchUnseenCount } = trpc.notifications.getUnseenCount.useQuery(
    undefined,
    {
      // No background polling; rely on query mount, window focus, and explicit refetches.
      refetchInterval: false,
      refetchOnWindowFocus: true,
    }
  );

  const unseenCount = unseenCountData?.count ?? 0;

  const utils = trpc.useUtils();

  // Mark as seen mutation
  const markAsSeenMutation = trpc.notifications.markAsSeen.useMutation({
    onMutate: async (variables) => {
      setUpdatingNotificationId(variables.id);

      // Cancel any outgoing refetches
      await utils.notifications.getAll.cancel();
      await utils.notifications.getUnseenCount.cancel();

      // Snapshot the previous value
      const previousNotifications = utils.notifications.getAll.getData({ limit: 50, offset: 0 });
      const previousUnseenCount = utils.notifications.getUnseenCount.getData();

      // Optimistically update list
      utils.notifications.getAll.setData({ limit: 50, offset: 0 }, (old) => {
        if (!old) return [];
        return old.map((n) =>
          n.id === variables.id ? { ...n, seen: true } : n
        );
      });

      // Calculate if count should change
      const wasUnseen = previousNotifications?.find(n => n.id === variables.id)?.seen === false;

      // Update TRPC cache for consistency
      utils.notifications.getUnseenCount.setData(undefined, (old) => {
        if (!old) return { count: 0 };
        return wasUnseen ? { count: Math.max(0, old.count - 1) } : old;
      });

      return { previousNotifications, previousUnseenCount };
    },
    onSuccess: () => {
      setUpdatingNotificationId(null);
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousNotifications) {
        utils.notifications.getAll.setData({ limit: 50, offset: 0 }, context.previousNotifications);
      }
      if (context?.previousUnseenCount) {
        utils.notifications.getUnseenCount.setData(undefined, context.previousUnseenCount);
      }

      setUpdatingNotificationId(null);
    },
    onSettled: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnseenCount.invalidate();
    },
  });

  // Mark as unseen mutation
  const markAsUnseenMutation = trpc.notifications.markAsUnseen.useMutation({
    onMutate: async (variables) => {
      setUpdatingNotificationId(variables.id);

      await utils.notifications.getAll.cancel();
      await utils.notifications.getUnseenCount.cancel();

      const previousNotifications = utils.notifications.getAll.getData({ limit: 50, offset: 0 });
      const previousUnseenCount = utils.notifications.getUnseenCount.getData();

      utils.notifications.getAll.setData({ limit: 50, offset: 0 }, (old) => {
        if (!old) return [];
        return old.map((n) =>
          n.id === variables.id ? { ...n, seen: false } : n
        );
      });

      const wasSeen = previousNotifications?.find(n => n.id === variables.id)?.seen === true;

      utils.notifications.getUnseenCount.setData(undefined, (old) => {
        if (!old) return { count: 0 };
        return wasSeen ? { count: old.count + 1 } : old;
      });

      return { previousNotifications, previousUnseenCount };
    },
    onSuccess: () => {
      setUpdatingNotificationId(null);
    },
    onError: (error, variables, context) => {
      if (context?.previousNotifications) {
        utils.notifications.getAll.setData({ limit: 50, offset: 0 }, context.previousNotifications);
      }
      if (context?.previousUnseenCount) {
        utils.notifications.getUnseenCount.setData(undefined, context.previousUnseenCount);
      }

      setUpdatingNotificationId(null);
    },
    onSettled: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnseenCount.invalidate();
    },
  });

  // Delete mutation
  const deleteMutation = trpc.notifications.delete.useMutation({
    onMutate: async (variables) => {
      setUpdatingNotificationId(variables.id);

      await utils.notifications.getAll.cancel();
      await utils.notifications.getUnseenCount.cancel();

      const previousNotifications = utils.notifications.getAll.getData({ limit: 50, offset: 0 });
      const previousUnseenCount = utils.notifications.getUnseenCount.getData();

      // Optimistically remove from list
      utils.notifications.getAll.setData({ limit: 50, offset: 0 }, (old) => {
        if (!old) return [];
        return old.filter((n) => n.id !== variables.id);
      });

      const wasUnseen = previousNotifications?.find(n => n.id === variables.id)?.seen === false;

      // Optimistically decrement count if it was unseen
      utils.notifications.getUnseenCount.setData(undefined, (old) => {
        if (!old) return { count: 0 };
        return wasUnseen ? { count: Math.max(0, old.count - 1) } : old;
      });

      return { previousNotifications, previousUnseenCount };
    },
    onSuccess: () => {
      setUpdatingNotificationId(null);
    },
    onError: (error, variables, context) => {
      if (context?.previousNotifications) {
        utils.notifications.getAll.setData({ limit: 50, offset: 0 }, context.previousNotifications);
      }
      if (context?.previousUnseenCount) {
        utils.notifications.getUnseenCount.setData(undefined, context.previousUnseenCount);
      }

      setUpdatingNotificationId(null);
    },
    onSettled: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnseenCount.invalidate();
    },
  });

  // Mark all as read mutation
  const markAllAsSeenMutation = trpc.notifications.markAllAsSeen.useMutation({
    onMutate: async () => {
      await utils.notifications.getAll.cancel();
      await utils.notifications.getUnseenCount.cancel();

      const previousNotifications = utils.notifications.getAll.getData({ limit: 50, offset: 0 });
      const previousUnseenCount = utils.notifications.getUnseenCount.getData();

      utils.notifications.getAll.setData({ limit: 50, offset: 0 }, (old) => {
        if (!old) return [];
        return old.map((n) => ({ ...n, seen: true }));
      });

      utils.notifications.getUnseenCount.setData(undefined, { count: 0 });

      return { previousNotifications, previousUnseenCount };
    },
    onSuccess: () => {},
    onError: (error, variables, context) => {
      if (context?.previousNotifications) {
        utils.notifications.getAll.setData({ limit: 50, offset: 0 }, context.previousNotifications);
      }
      if (context?.previousUnseenCount) {
        utils.notifications.getUnseenCount.setData(undefined, context.previousUnseenCount);
      }
    },
    onSettled: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnseenCount.invalidate();
    },
  });

  const handleNotificationClick = (notification: { id: string; link: string | null; seen: boolean }) => {
    // Mark as seen if not already seen
    if (!notification.seen) {
      markAsSeenMutation.mutate({ id: notification.id });
    }

    // Navigate if link exists
    if (notification.link) {
      void navigate(notification.link);
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

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteMutation.mutate({ id: notificationId });
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
              <Spinner variant="ellipsis" className="text-primary mb-2" size={20} />
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
                      "w-full text-left px-4 py-3 hover:bg-accent transition-colors cursor-pointer group",
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Delete Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteClick(e, notification.id)}
                                type="button"
                                disabled={updatingNotificationId === notification.id}
                              >
                                {updatingNotificationId === notification.id ? (
                                  <Spinner size={14} className="text-destructive" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete notification</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Mark Read/Unread Button */}
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
                                  <Spinner size={14} />
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
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-1" />
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
