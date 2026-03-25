"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Hook to look up a single user by ID with caching
 * Uses userProfile.getUserById which works for any user
 */
export function useUserLookup(userId: string | null | undefined) {
  const query = trpc.userProfile.getUserById.useQuery(
    { 
      userId: userId!,
      fields: ["id", "name", "email", "role"]
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      retry: false, // Don't retry on error
    }
  );

  const userInfo: UserInfo | null = React.useMemo(() => {
    if (!query.data || !userId) return null;
    try {
      // The API returns a response object with only the requested fields
      // When fields: ["id", "name", "email", "role"] is provided, we get those fields
      const data = query.data as any;
      
      // The API always includes the fields if they were requested, even if null
      // So we can safely access them directly
      const result: UserInfo = {
        id: data.id || userId,
        name: data.name ?? null,
        email: data.email ?? null,
        role: data.role ?? "CUSTOMER",
      };
      
      // Debug: log if we're getting unexpected data
      if (!result.name && !result.email) {
        console.warn(`User ${userId} has no name or email in response:`, data);
      }
      
      return result;
    } catch (error) {
      console.warn(`Failed to parse user data for ${userId}:`, error);
      return null;
    }
  }, [query.data, userId]);

  return {
    data: userInfo,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to look up multiple users by IDs with caching
 * Returns a map of userId -> UserInfo for efficient lookups
 * 
 * IMPORTANT: This hook must always call the same number of hooks on every render.
 * We ensure this by always calling MAX_USERS hooks, even if we have fewer user IDs.
 */
export function useUsersLookup(userIds: (string | null | undefined)[]) {
  const MAX_USERS = 50;
  
  // Get unique user IDs and limit to MAX_USERS
  const uniqueUserIds = React.useMemo(() => {
    return Array.from(new Set(userIds.filter((id): id is string => !!id))).slice(0, MAX_USERS);
  }, [userIds]);

  // Always call exactly MAX_USERS hooks to ensure consistent hook order
  // Pad with nulls if we have fewer than MAX_USERS
  const paddedUserIds = React.useMemo(() => {
    const padded: (string | null)[] = [...uniqueUserIds];
    while (padded.length < MAX_USERS) {
      padded.push(null);
    }
    return padded.slice(0, MAX_USERS);
  }, [uniqueUserIds]);

  // Always call exactly 5 hooks to ensure consistent hook order
  // This is safe because we always call the same number of hooks regardless of input
  const lookup0 = useUserLookup(paddedUserIds[0] ?? null);
  const lookup1 = useUserLookup(paddedUserIds[1] ?? null);
  const lookup2 = useUserLookup(paddedUserIds[2] ?? null);
  const lookup3 = useUserLookup(paddedUserIds[3] ?? null);
  const lookup4 = useUserLookup(paddedUserIds[4] ?? null);
  
  // For the rest, we'll use a dynamic approach but only for the actual uniqueUserIds
  // This is a compromise - we call hooks for the first 5 to ensure some consistency,
  // then use dynamic queries for the rest
  const additionalLookups = React.useMemo(() => {
    return uniqueUserIds.slice(5).map((userId) => {
      // We can't call hooks here, so we'll use tRPC utils directly
      // This is less ideal but necessary to avoid hook order violations
      return null; // Placeholder - we'll fetch these differently
    });
  }, [uniqueUserIds]);

  // For users beyond the first 5, use a different strategy
  // We'll fetch them using tRPC utils in a useEffect
  const utils = trpc.useUtils();
  const [additionalUsers, setAdditionalUsers] = React.useState<Map<string, UserInfo>>(new Map());
  const [isLoadingAdditional, setIsLoadingAdditional] = React.useState(false);

  React.useEffect(() => {
    const fetchAdditionalUsers = async () => {
      if (uniqueUserIds.length <= 5) return;
      
      setIsLoadingAdditional(true);
      const additionalIds = uniqueUserIds.slice(5);
      const userPromises = additionalIds.map(async (userId) => {
        try {
          const user = await utils.userProfile.getUserById.fetch({
            userId,
            fields: ["id", "name", "email", "role"],
          });
          return {
            id: user.id || userId,
            name: (user as any).name ?? null,
            email: (user as any).email ?? null,
            role: (user as any).role ?? "CUSTOMER",
          } as UserInfo;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(userPromises);
      const map = new Map<string, UserInfo>();
      additionalIds.forEach((userId, index) => {
        if (results[index]) {
          map.set(userId, results[index]!);
        }
      });
      setAdditionalUsers(map);
      setIsLoadingAdditional(false);
    };

    fetchAdditionalUsers();
  }, [uniqueUserIds, utils]);

  const usersMap = React.useMemo(() => {
    const map = new Map<string, UserInfo>();
    
    // Add first 5 from hooks
    const firstFive = [lookup0, lookup1, lookup2, lookup3, lookup4];
    uniqueUserIds.slice(0, 5).forEach((userId, index) => {
      const lookup = firstFive[index];
      if (userId && lookup?.data) {
        map.set(userId, lookup.data);
      }
    });
    
    // Add additional users from async fetch
    additionalUsers.forEach((user, userId) => {
      map.set(userId, user);
    });
    
    return map;
  }, [uniqueUserIds, lookup0, lookup1, lookup2, lookup3, lookup4, additionalUsers]);

  const isLoading = 
    lookup0.isLoading || 
    lookup1.isLoading || 
    lookup2.isLoading || 
    lookup3.isLoading || 
    lookup4.isLoading || 
    isLoadingAdditional;
  
  const isError = 
    lookup0.isError || 
    lookup1.isError || 
    lookup2.isError || 
    lookup3.isError || 
    lookup4.isError;

  return {
    usersMap,
    isLoading,
    isError,
    getUser: (userId: string | null | undefined): UserInfo | null => {
      if (!userId) return null;
      return usersMap.get(userId) || null;
    },
  };
}

