import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
  fetchOptions: {
    onError(e) {
      // Log errors but don't throw - let the calling code handle them
      console.error("Auth client error:", e);
    },
  },
});
