"use client";

import * as React from "react";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Custom hook to fetch a single user name by ID with proper caching
 * Uses react-query caching to avoid refetching when switching tabs
 */
export function useUserName(userId: string | null | undefined) {
  const { data, isLoading } = trpc.userProfile.getUserById.useQuery(
    { userId: userId || "", fields: ["id", "name"] },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - longer cache for user names
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
      enabled: !!userId, // Only fetch if userId exists
    }
  );

  return {
    name: data?.name || userId || "—",
    isLoading,
  };
}

/**
 * Custom hook to fetch multiple user names by user IDs with proper caching
 * Uses react-query caching to avoid refetching when switching tabs
 * 
 * This hook prefetches all users in parallel and then uses individual
 * useQuery hooks to read from cache, ensuring proper react-query caching.
 */
export function useUserNames(userIds: string[]) {
  // Get unique user IDs
  const uniqueUserIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))), [userIds]);
  const utils = trpc.useUtils();

  // Prefetch all users in parallel - this populates react-query cache
  React.useEffect(() => {
    if (uniqueUserIds.length === 0) return;
    
    // Prefetch all users in parallel
    Promise.all(
      uniqueUserIds.map((userId) =>
        utils.userProfile.getUserById.fetch(
          { userId, fields: ["id", "name"] },
          {
            staleTime: 10 * 60 * 1000,
          }
        )
      )
    ).catch((error) => {
      // Silently handle errors - we'll show IDs as fallback
      console.warn("Failed to prefetch some user names:", error);
    });
  }, [uniqueUserIds, utils]);

  // Use individual queries to read from cache (they won't refetch if cached)
  // Note: We can't call hooks in a loop, so we need a different approach
  // Instead, we'll use a state to track names and fetch them
  const [userNamesMap, setUserNamesMap] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (uniqueUserIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Fetch all users and update state
    Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const data = await utils.userProfile.getUserById.fetch(
            { userId, fields: ["id", "name"] },
            { staleTime: 10 * 60 * 1000 }
          );
          return { userId, name: data.name || userId };
        } catch {
          return { userId, name: userId }; // Fallback to ID on error
        }
      })
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach(({ userId, name }) => {
        map[userId] = name;
      });
      setUserNamesMap(map);
      setIsLoading(false);
    });
  }, [uniqueUserIds, utils]);

  // Get a user name by ID, fallback to ID if not found or loading
  const getUserName = (userId: string | null | undefined): string => {
    if (!userId) return "—";
    if (isLoading && !userNamesMap[userId]) return userId; // Return ID while loading
    return userNamesMap[userId] || userId; // Return name or fallback to ID
  };

  return {
    userNamesMap,
    getUserName,
    isLoading,
  };
}

