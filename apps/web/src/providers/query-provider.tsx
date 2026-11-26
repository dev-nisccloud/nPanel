"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { apiUrl, authClient } from "@/lib/auth-client";
import { isPublicPath } from "@/lib/session-gate";
import { trpc } from "@/utils/trpc";

// Use the same server origin that authClient uses for tRPC calls.
const trpcBaseUrl = apiUrl("/api/trpc");

interface QueryProviderProps {
  children: React.ReactNode;
}

function isUnauthorized(error: unknown): boolean {
  const err = error as { data?: { code?: string } } | undefined;
  return err?.data?.code === "UNAUTHORIZED";
}

function is4xx(error: unknown): boolean {
  const details = error as { status?: number; data?: { httpStatus?: number; code?: string } };
  if (details?.data?.code === "TOO_MANY_REQUESTS") return true;
  const status = details?.data?.httpStatus ?? details?.status;
  return typeof status === "number" && status >= 400 && status < 500;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each app instance
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          retry: (failureCount, error: unknown) => {
            if (isUnauthorized(error)) return false;
            if (is4xx(error)) return false;
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
        },
        mutations: {
          retry: (failureCount, error: unknown) => {
            if (isUnauthorized(error)) return false;
            if (is4xx(error)) return false;
            return failureCount < 2;
          },
        },
      },
    });

    // When session has expired (UNAUTHORIZED), sign out and redirect to login - but never from public/auth routes (avoids redirect loops).
    const redirectToLogin = () => {
      if (typeof window !== "undefined" && isPublicPath(window.location.pathname)) {
        return;
      }
      authClient.signOut().then(() => {
        if (typeof window !== "undefined" && isPublicPath(window.location.pathname)) {
          return;
        }
        window.location.href = "/auth/login";
      });
    };
    client.getQueryCache().subscribe((event) => {
      if (event?.type === "updated" && event.query.state.status === "error" && isUnauthorized(event.query.state.error))
        redirectToLogin();
    });
    client.getMutationCache().subscribe((event) => {
      if (event?.type === "updated" && event.mutation.state.status === "error" && isUnauthorized(event.mutation.state.error))
        redirectToLogin();
    });

    return client;
  });

  const [trpcClient] = useState(() => {
    const fetchWithCredentials: typeof fetch = (input, init) =>
      fetch(input, { ...init, credentials: "include" });
    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.path === "paymentGateway.mpesa.queryStkPush",
          true: httpLink({ url: trpcBaseUrl, fetch: fetchWithCredentials }),
          false: httpBatchLink({ url: trpcBaseUrl, fetch: fetchWithCredentials }),
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Only show devtools in development */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools 
            initialIsOpen={false}
          />
        )}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
