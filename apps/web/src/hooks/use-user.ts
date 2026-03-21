"use client";

import { useQuery } from "@tanstack/react-query";

// Mock user data based on what the components expect
const mockUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  weekStartsOnMonday: false,
  timezone: "UTC",
  locale: "en-US",
  currency: "USD",
};

export function useUserQuery() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => Promise.resolve(mockUser),
    staleTime: Infinity, // Mock data doesn't change
  });
}
