"use client";

import * as React from "react";
import { Bell } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";

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

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.getAll.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    {
      refetchInterval: isOpen ? 10000 : 30000, // Refetch every 10s when open, 30s when closed
      refetchOnWindowFocus: true,
    }
  );

  // Fetch unseen count
  const { data: unseenCountData } = trpc.notifications.getUnseenCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Refetch every 10s
      refetchOnWindowFocus: true,
    }
  );

  const unseenCount = unseenCountData?.count ?? 0;

  // Mark as seen mutation
  const markAsSeenMutation = trpc.notifications.markAsSeen.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read", {
        description: error.message,
      });
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
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
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
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatDistanceToNow(createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.seen && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
