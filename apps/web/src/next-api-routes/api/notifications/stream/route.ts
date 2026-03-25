import { auth } from "@npanel/auth";
import prisma from "@npanel/db";

// Store active SSE connections per user
const activeConnections = new Map<string, Set<ReadableStreamDefaultController>>();

// Event emitter for cross-module communication
class NotificationEventEmitter extends EventTarget {
  emit(event: string, data: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

const notificationEvents = new NotificationEventEmitter();

// Listen for notification creation events
if (typeof globalThis !== 'undefined') {
  // Set up global event listeners for notification updates
  const setupGlobalListeners = () => {
    // This will be called when notifications are created/updated
    // We'll use a polling mechanism within the SSE connection instead
    // to avoid cross-module dependencies
  };
  setupGlobalListeners();
}

/**
 * Broadcast notification to all connected clients for a user
 * This is called when a new notification is created
 */
function broadcastNotificationToUser(userId: string, notification: {
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
}) {
  const userConnections = activeConnections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return;
  }

  const message = `data: ${JSON.stringify({
    type: 'notification',
    data: notification,
  })}\n\n`;

  // Send to all connections for this user
  const deadConnections: ReadableStreamDefaultController[] = [];
  userConnections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // Connection is dead, mark for removal
      deadConnections.push(controller);
    }
  });

  // Clean up dead connections
  deadConnections.forEach((controller) => {
    userConnections.delete(controller);
  });

  // Remove user entry if no connections left
  if (userConnections.size === 0) {
    activeConnections.delete(userId);
  }
}

/**
 * Broadcast unseen count update to all connected clients for a user
 */
function broadcastUnseenCountToUser(userId: string, count: number) {
  const userConnections = activeConnections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return;
  }

  const message = `data: ${JSON.stringify({
    type: 'unseen_count',
    data: { count },
  })}\n\n`;

  const deadConnections: ReadableStreamDefaultController[] = [];
  userConnections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      deadConnections.push(controller);
    }
  });

  deadConnections.forEach((controller) => {
    userConnections.delete(controller);
  });

  if (userConnections.size === 0) {
    activeConnections.delete(userId);
  }
}

// Poll for new notifications and broadcast to connected clients
// This runs in the background for each connected user
function startNotificationPoller(userId: string, controller: ReadableStreamDefaultController): () => void {
  let lastCheckTime = new Date();
  let isActive = true;

  const pollInterval = setInterval(async () => {
    if (!isActive) {
      clearInterval(pollInterval);
      return;
    }

    try {
      // Check for new notifications since last check
      const newNotifications = await prisma.notification.findMany({
        where: {
          userId,
          updatedAt: {
            gt: lastCheckTime,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Limit to recent notifications
      });

      // Broadcast new notifications
      for (const notification of newNotifications) {
        const transformed = {
          id: notification.id,
          userId: notification.userId,
          teamId: notification.teamId,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          seen: notification.seen,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString(),
        };

        const message = `data: ${JSON.stringify({
          type: 'notification',
          data: transformed,
        })}\n\n`;

        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          // Connection closed
          isActive = false;
          clearInterval(pollInterval);
          return;
        }
      }

      // Update unseen count
      const unseenCount = await prisma.notification.count({
        where: {
          userId,
          seen: false,
        },
      });

      const countMessage = `data: ${JSON.stringify({
        type: 'unseen_count',
        data: { count: unseenCount },
      })}\n\n`;

      try {
        controller.enqueue(new TextEncoder().encode(countMessage));
      } catch (error) {
        isActive = false;
        clearInterval(pollInterval);
        return;
      }

      // Update last check time
      lastCheckTime = new Date();
    } catch (error) {
      console.error("Error polling notifications:", error);
    }
  }, 5000); // Poll every 5 seconds

  // Clean up on connection close
  return () => {
    isActive = false;
    clearInterval(pollInterval);
  };
}

export async function GET(req: Request) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Add connection to user's active connections
        if (!activeConnections.has(userId)) {
          activeConnections.set(userId, new Set());
        }
        activeConnections.get(userId)!.add(controller);

        // Send initial connection message
        const initMessage = `data: ${JSON.stringify({
          type: 'connected',
          data: { userId },
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initMessage));

        // Send initial unseen count
        prisma.notification.count({
          where: {
            userId,
            seen: false,
          },
        }).then((count) => {
          const countMessage = `data: ${JSON.stringify({
            type: 'unseen_count',
            data: { count },
          })}\n\n`;
          try {
            controller.enqueue(new TextEncoder().encode(countMessage));
          } catch (error) {
            // Connection closed
          }
        }).catch((error) => {
          console.error("Error fetching initial unseen count:", error);
        });

        // Start notification poller for this connection
        const cleanupPoller = startNotificationPoller(userId, controller);

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              data: { timestamp: new Date().toISOString() },
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(heartbeat));
          } catch (error) {
            // Connection closed, stop heartbeat
            clearInterval(heartbeatInterval);
            if (cleanupPoller) cleanupPoller();
          }
        }, 30000);

        // Clean up on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          if (cleanupPoller) cleanupPoller();
          const userConnections = activeConnections.get(userId);
          if (userConnections) {
            userConnections.delete(controller);
            if (userConnections.size === 0) {
              activeConnections.delete(userId);
            }
          }
          try {
            controller.close();
          } catch (error) {
            // Already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
